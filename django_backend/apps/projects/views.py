from django.db import DatabaseError, connection
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from banglasketch_api.pagination import encode_cursor, parse_pagination, EnvelopePagination
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from apps.core.models import AuditLog
from .models import Project
from .serializers import ProjectSerializer

class PublicProjectListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        allowed = {"page", "limit", "cursor", "category", "featured", "search"}
        if set(request.query_params) - allowed:
            return Response({"success": False, "error": "Invalid filter"}, status=400)
        try:
            page, limit, cursor = parse_pagination(request.query_params)
        except ValueError:
            return Response({"success": False, "error": "Invalid pagination"}, status=400)
        for key in ("category", "featured", "search"):
            values = request.query_params.getlist(key)
            if len(values) > 1 or (values and len(values[0]) > 200):
                return Response({"success": False, "error": "Invalid filter"}, status=400)
        qs = Project.objects.filter(published=True, deleted_at__isnull=True)
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        if request.query_params.get("featured") == "true":
            qs = qs.filter(featured=True)
        search = request.query_params.get("search")
        if search:
            if connection.vendor == "postgresql":
                    # Match Express pg_trgm search in production.
                    from django.db.models.expressions import RawSQL
                    qs = qs.annotate(search_similarity=RawSQL(
                        "similarity(title || ' ' || COALESCE(description,'') || ' ' || category, %s)",
                        [search],
                    )).filter(search_similarity__gt=0.05)
            else:
                qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search) | Q(category__icontains=search))
        if cursor:
            qs = qs.filter(id__lt=cursor)
        offset = 0 if cursor else (page - 1) * limit
        fields = ("id", "title", "slug", "description", "category", "featured_image", "date_completed", "featured")
        try:
            rows = list(qs.order_by("-id").values(*fields)[offset:offset + limit + 1])
        except DatabaseError:
            return Response({"success": False, "error": "Unable to process request"}, status=500)
        data = [express_project(row) for row in rows[:limit]]
        response = Response({"success": True, "data": data, "pagination": {
            "page": page, "limit": limit, "hasMore": len(rows) > limit,
            "nextCursor": encode_cursor(data[-1]["id"]) if len(rows) > limit else None,
        }})
        response["Cache-Control"] = "public, max-age=0, s-maxage=60"
        return response


class PublicProjectDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, slug):
        try:
            row = Project.objects.filter(slug=slug, published=True, deleted_at__isnull=True).values().first()
        except DatabaseError:
            return Response({"success": False, "error": "Unable to process request"}, status=500)
        if row is None:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": express_project(row)})


def express_project(row):
    """Preserve node-postgres JSON dates, including its process-local DATE interpretation."""
    from datetime import date, datetime, time, timezone as dt_timezone
    for key, value in row.items():
        if isinstance(value, datetime):
            row[key] = value.astimezone(dt_timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
        elif isinstance(value, date):
            # node-postgres constructs DATE values at midnight in the process timezone.
            value = datetime.combine(value, time()).astimezone(dt_timezone.utc)
            row[key] = value.isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return row


class AdminProjectListCreateView(APIView):
    def get_permissions(self):
        permissions = [IsAdminUserAuthenticated()]
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            permissions.append(require_role("editor")())
        return permissions

    def get(self, request):
        trash = request.query_params.get("trash", "").lower() in ["true", "1"]
        if trash:
            qs = Project.objects.filter(deleted_at__isnull=False).order_by("-deleted_at", "-id")
        else:
            qs = Project.objects.filter(deleted_at__isnull=True).order_by("-id")
        paginator = EnvelopePagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = ProjectSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ProjectSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            try:
                AuditLog.objects.create(
                    actor=request.user if hasattr(request.user, "id") else None,
                    action="create",
                    entity_type="projects",
                    entity_id=project.id,
                    after_data=ProjectSerializer(project).data,
                )
            except Exception:
                pass
            return Response({"success": True, "data": ProjectSerializer(project).data}, status=201)
        return Response({"success": False, "error": serializer.errors}, status=400)


class AdminProjectDetailUpdateDeleteView(APIView):
    def get_permissions(self):
        permissions = [IsAdminUserAuthenticated()]
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            permissions.append(require_role("editor")())
        return permissions

    def get(self, request, pk):
        project = Project.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not project:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": ProjectSerializer(project).data})

    def put(self, request, pk):
        project = Project.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not project:
            return Response({"success": False, "error": "Not found"}, status=404)

        before_data = ProjectSerializer(project).data
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            try:
                AuditLog.objects.create(
                    actor=request.user if hasattr(request.user, "id") else None,
                    action="update",
                    entity_type="projects",
                    entity_id=updated.id,
                    before_data=before_data,
                    after_data=ProjectSerializer(updated).data,
                )
            except Exception:
                pass
            return Response({"success": True, "data": ProjectSerializer(updated).data})
        return Response({"success": False, "error": serializer.errors}, status=400)

    def delete(self, request, pk):
        project = Project.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not project:
            return Response({"success": False, "error": "Not found"}, status=404)

        before_data = ProjectSerializer(project).data
        project.deleted_at = timezone.now()
        project.save(update_fields=["deleted_at"])
        try:
            AuditLog.objects.create(
                actor=request.user if hasattr(request.user, "id") else None,
                action="soft_delete",
                entity_type="projects",
                entity_id=project.id,
                before_data=before_data,
            )
        except Exception:
            pass
        return Response({"success": True, "message": "Project deleted successfully"})
