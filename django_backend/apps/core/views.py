import time
import datetime
from django.db import connection
from django.db.models import Sum, Avg
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from apps.projects.models import Project
from apps.blog.models import BlogPost
from apps.media_assets.models import Video, Testimonial
from apps.leads.models import ContactSubmission, NewsletterSubscriber
from apps.clients.models import Enquiry, ClientProject
from .models import SiteSetting, AuditLog

class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db_status = "ok"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_status = "unavailable"

        status_code = 200 if db_status == "ok" else 503
        return Response({
            "status": "ok" if db_status == "ok" else "degraded",
            "service": "Banglasketch API (Django)",
            "database": db_status,
            "time": timezone.now().isoformat(),
        }, status=status_code)


class HealthLiveView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class HealthReadyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return Response({"status": "ready"})
        except Exception:
            return Response({"status": "unavailable"}, status=503)


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("viewer")]

    def get(self, request):
        now = timezone.now()
        p_total = Project.objects.filter(deleted_at__isnull=True).count()
        p_pub = Project.objects.filter(deleted_at__isnull=True, published=True).count()
        p_feat = Project.objects.filter(deleted_at__isnull=True, featured=True).count()

        b_total = BlogPost.objects.filter(deleted_at__isnull=True).count()
        b_pub = BlogPost.objects.filter(deleted_at__isnull=True, published=True).count()
        b_sched = BlogPost.objects.filter(deleted_at__isnull=True, published=False, scheduled_publish_date__gt=now).count()
        b_views = BlogPost.objects.filter(deleted_at__isnull=True).aggregate(s=Sum("views_count"))["s"] or 0

        v_total = Video.objects.filter(deleted_at__isnull=True).count()
        v_pub = Video.objects.filter(deleted_at__isnull=True, published=True).count()

        t_total = Testimonial.objects.filter(deleted_at__isnull=True).count()
        t_avg_val = Testimonial.objects.filter(deleted_at__isnull=True).aggregate(a=Avg("rating"))["a"]
        t_avg = round(float(t_avg_val), 1) if t_avg_val is not None else 0.0

        c_total = ContactSubmission.objects.filter(deleted_at__isnull=True).count()
        c_unread = ContactSubmission.objects.filter(deleted_at__isnull=True, read=False).count()
        c_unresp = ContactSubmission.objects.filter(deleted_at__isnull=True, responded=False).count()
        c_7d = ContactSubmission.objects.filter(deleted_at__isnull=True, submitted_at__gt=now - datetime.timedelta(days=7)).count()

        n_active = NewsletterSubscriber.objects.filter(active=True).count()

        recent = ContactSubmission.objects.filter(deleted_at__isnull=True).order_by("-submitted_at")[:5]
        recent_contacts = [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "service_type": c.service_type,
                "read": c.read,
                "responded": c.responded,
                "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
            }
            for c in recent
        ]

        return Response({
            "success": True,
            "data": {
                # Express flat fields for Next.js CMS dashboard
                "projects": p_total,
                "blogPosts": b_total,
                "unreadContacts": c_unread,
                "testimonials": t_total,
                # Express detail breakdown
                "detail": {
                    "projects": {"total": p_total, "published": p_pub, "featured": p_feat},
                    "blog": {"total": b_total, "published": b_pub, "scheduled": b_sched, "views": b_views},
                    "videos": {"total": v_total, "published": v_pub},
                    "testimonials": {"total": t_total, "avg_rating": t_avg},
                    "contacts": {"total": c_total, "unread": c_unread, "unresponded": c_unresp, "last_7_days": c_7d},
                    "subscribers": n_active,
                },
                "recentContacts": recent_contacts,
                # Legacy Django fields
                "projects_count": p_total,
                "published_projects_count": p_pub,
                "blog_posts_count": b_total,
                "published_blog_count": b_pub,
                "videos_count": v_total,
                "testimonials_count": t_total,
                "unread_contacts_count": c_unread,
                "newsletter_subscribers_count": n_active,
                "new_enquiries_count": Enquiry.objects.filter(status="new_enquiry", deleted_at__isnull=True).count(),
                "active_client_projects_count": ClientProject.objects.filter(deleted_at__isnull=True).count(),
            }
        })


class AdminSettingsView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request, key=None):
        if key:
            setting = SiteSetting.objects.filter(key=key).first()
            val = setting.value if setting else {}
            return Response({"success": True, "data": val})

        settings_qs = SiteSetting.objects.all()
        data = {s.key: s.value for s in settings_qs}
        return Response({"success": True, "data": data})

    def put(self, request, key=None):
        if key:
            SiteSetting.objects.update_or_create(
                key=key,
                defaults={"value": request.data},
            )
            return Response({"success": True})

        for k, value in request.data.items():
            SiteSetting.objects.update_or_create(
                key=k,
                defaults={"value": value},
            )
        settings_qs = SiteSetting.objects.all()
        data = {s.key: s.value for s in settings_qs}
        return Response({"success": True, "data": data})


class AdminAuditLogsView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request):
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (ValueError, TypeError):
            page = 1
        try:
            limit = min(200, max(1, int(request.query_params.get("limit", 50))))
        except (ValueError, TypeError):
            limit = 50
        offset = (page - 1) * limit

        logs = AuditLog.objects.select_related("actor").order_by("-id")[offset : offset + limit + 1]
        has_more = len(logs) > limit
        items = logs[:limit]

        data = [
            {
                "id": log.id,
                "actor_id": log.actor_id,
                "actor_email": log.actor.email if log.actor else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": str(log.entity_id) if log.entity_id is not None else None,
                "before_data": log.before_data,
                "after_data": log.after_data,
                "ip_address": log.ip_address,
                "request_id": log.request_id,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in items
        ]
        return Response({
            "success": True,
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "hasMore": has_more,
            },
        })


class AdminUploadView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request):
        # Cloudinary direct upload or sign request
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"success": False, "error": "No file uploaded"}, status=400)

        import cloudinary.uploader
        try:
            upload_result = cloudinary.uploader.upload(
                file_obj,
                folder="banglasketch",
                resource_type="auto",
            )
            return Response({
                "success": True,
                "data": {
                    "url": upload_result.get("secure_url"),
                    "public_id": upload_result.get("public_id"),
                    "format": upload_result.get("format"),
                    "bytes": upload_result.get("bytes"),
                }
            })
        except Exception as e:
            return Response({"success": False, "error": f"Upload failed: {str(e)}"}, status=500)


class AdminCloudinarySignView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        import time
        import re
        import cloudinary.utils
        from django.conf import settings

        if not getattr(settings, "CLOUDINARY_API_SECRET", None) or not getattr(settings, "CLOUDINARY_API_KEY", None) or not getattr(settings, "CLOUDINARY_CLOUD_NAME", None):
            return Response({"success": False, "error": "Cloudinary is not configured on the backend"}, status=500)

        timestamp = int(time.time())
        requested = request.query_params.get("folder", "general")
        requested = re.sub(r"^banglasketch/", "", requested)
        if not re.match(r"^[a-zA-Z0-9_-]{1,40}$", requested):
            return Response({"success": False, "error": "Invalid upload folder"}, status=400)

        folder = f"banglasketch/{requested}"
        params_to_sign = {
            "timestamp": timestamp,
            "folder": folder,
            "allowed_formats": "jpg,jpeg,png,webp,avif",
            "max_bytes": 10485760,
            "transformation": "c_limit,w_4096,h_4096",
        }
        signature = cloudinary.utils.api_sign_request(params_to_sign, settings.CLOUDINARY_API_SECRET)

        return Response({
            "success": True,
            "timestamp": timestamp,
            "folder": folder,
            "allowedFormats": ["jpg", "jpeg", "png", "webp", "avif"],
            "maxBytes": 10485760,
            "transformation": "c_limit,w_4096,h_4096",
            "signature": signature,
            "apiKey": settings.CLOUDINARY_API_KEY,
            "cloudName": settings.CLOUDINARY_CLOUD_NAME,
        })


class AdminRestoreView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request, entity, id):
        from apps.projects.models import Project
        from apps.blog.models import BlogPost
        from apps.media_assets.models import Video, Testimonial
        from apps.leads.models import ContactSubmission

        entity_map = {
            "projects": Project,
            "blog": BlogPost,
            "blog_posts": BlogPost,
            "videos": Video,
            "testimonials": Testimonial,
            "contacts": ContactSubmission,
            "contact_submissions": ContactSubmission,
        }

        model = entity_map.get(entity)
        if not model:
            return Response({"success": False, "error": "Invalid entity"}, status=400)

        item = model.objects.filter(id=id).first()
        if not item:
            return Response({"success": False, "error": "Item not found"}, status=404)

        item.deleted_at = None
        item.save(update_fields=["deleted_at"])

        AuditLog.objects.create(
            actor=request.user if hasattr(request.user, "id") else None,
            action="restore",
            entity_type=entity,
            entity_id=int(id),
            after_data={"restored": True},
        )

        return Response({"success": True, "message": "Item restored successfully"})


class AdminPermanentDeleteView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def delete(self, request, entity, id):
        from apps.projects.models import Project
        from apps.blog.models import BlogPost
        from apps.media_assets.models import Video, Testimonial
        from apps.leads.models import ContactSubmission

        entity_map = {
            "projects": Project,
            "blog": BlogPost,
            "blog_posts": BlogPost,
            "videos": Video,
            "testimonials": Testimonial,
            "contacts": ContactSubmission,
            "contact_submissions": ContactSubmission,
        }

        model = entity_map.get(entity)
        if not model:
            return Response({"success": False, "error": "Invalid entity"}, status=400)

        item = model.objects.filter(id=id, deleted_at__isnull=False).first()
        if not item:
            return Response({"success": False, "error": "Deleted item not found"}, status=404)

        AuditLog.objects.create(
            actor=request.user if hasattr(request.user, "id") else None,
            action="permanent_delete",
            entity_type=entity,
            entity_id=int(id),
            before_data={"deleted": True},
        )

        item.delete()
        return Response({"success": True, "message": "Item permanently deleted"})
