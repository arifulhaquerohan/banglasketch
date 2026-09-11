import time
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from banglasketch_api.pagination import EnvelopePagination
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from apps.core.services.rate_limit import PostgresRateLimiter
from .models import ContactSubmission, NewsletterSubscriber, ContactEmailJob
from .serializers import ContactSubmissionSerializer, NewsletterSubscriberSerializer

def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


# Public Contact & Newsletter Views
class PublicContactSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip = get_client_ip(request)

        # Rate limiting: 10 inquiries per 15 minutes in production
        if not settings.DEBUG:
            limiter = PostgresRateLimiter("contact", 15 * 60 * 1000, 10)
            allowed, hits, reset_at = limiter.check_and_increment(ip)
            if not allowed:
                return Response({
                    "success": False,
                    "error": "Too many contact submissions. Please wait a few minutes before trying again."
                }, status=429)

        # Honeypot spam check: 'website' field must be blank
        website = request.data.get("website", "")
        if website:
            # Silently accept to avoid alerting bot
            return Response({
                "success": True,
                "message": "Thank you for contacting us. We will get back to you shortly.",
            }, status=201)

        # Bot timing check (if client provided started_at timestamp)
        started_at = request.data.get("started_at")
        if isinstance(started_at, (int, float)):
            now_ms = time.time() * 1000
            if now_ms - started_at < 1000:
                # Submitted in less than 1 second — bot behavior
                return Response({
                    "success": True,
                    "message": "Thank you for contacting us. We will get back to you shortly.",
                }, status=201)

        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        phone = (request.data.get("phone") or "").strip()
        service_type = (request.data.get("service_type") or request.data.get("serviceType") or "").strip()
        message = (request.data.get("message") or "").strip()

        if not name or not email or not message:
            return Response({"success": False, "error": "Name, email, and message are required"}, status=400)

        if len(name) > 160 or len(email) > 160 or len(phone) > 160 or len(service_type) > 160:
            return Response({"success": False, "error": "One or more fields exceed maximum allowed length"}, status=400)

        if len(message) > 5000:
            return Response({"success": False, "error": "Message exceeds maximum allowed length"}, status=400)

        # Atomic creation of submission and email jobs
        with transaction.atomic():
            submission = ContactSubmission.objects.create(
                name=name,
                email=email,
                phone=phone,
                service_type=service_type,
                message=message,
            )

            ContactEmailJob.objects.create(submission=submission, kind="notification")
            ContactEmailJob.objects.create(submission=submission, kind="confirmation")

        return Response({
            "success": True,
            "id": submission.id,
            "message": "Thank you for contacting us. We will get back to you shortly.",
        }, status=201)


class PublicNewsletterSubscribeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email or "@" not in email:
            return Response({"success": False, "error": "A valid email address is required"}, status=400)

        subscriber, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={"active": True},
        )
        if not created and not subscriber.active:
            subscriber.active = True
            subscriber.save(update_fields=["active"])

        return Response({
            "success": True,
            "message": "Thank you for subscribing to our studio newsletter.",
        })


# Admin Contact Submissions Views
class AdminContactSubmissionListView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        trash = request.query_params.get("trash", "").lower() in ["true", "1"]
        if trash:
            qs = ContactSubmission.objects.filter(deleted_at__isnull=False).order_by("-deleted_at")
        else:
            qs = ContactSubmission.objects.filter(deleted_at__isnull=True).order_by("-submitted_at")
        paginator = EnvelopePagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = ContactSubmissionSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ContactSubmissionSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


class AdminContactSubmissionDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request, pk):
        sub = ContactSubmission.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not sub:
            return Response({"success": False, "error": "Not found"}, status=404)
        return Response({"success": True, "data": ContactSubmissionSerializer(sub).data})

    def patch(self, request, pk):
        sub = ContactSubmission.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not sub:
            return Response({"success": False, "error": "Not found"}, status=404)

        for field in ["read", "responded"]:
            if field in request.data:
                setattr(sub, field, bool(request.data[field]))

        sub.save()
        return Response({"success": True, "data": ContactSubmissionSerializer(sub).data})

    put = patch

    def delete(self, request, pk):
        sub = ContactSubmission.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not sub:
            return Response({"success": False, "error": "Not found"}, status=404)

        sub.deleted_at = timezone.now()
        sub.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Contact submission deleted"})


# Admin Newsletter Views
class AdminNewsletterListView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        qs = NewsletterSubscriber.objects.all().order_by("-subscribed_at")
        paginator = EnvelopePagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            serializer = NewsletterSubscriberSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = NewsletterSubscriberSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


class AdminNewsletterDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def delete(self, request, pk):
        try:
            sub = NewsletterSubscriber.objects.get(pk=pk)
            sub.delete()
            return Response({"success": True, "message": "Subscriber deleted"})
        except NewsletterSubscriber.DoesNotExist:
            return Response({"success": False, "error": "Not found"}, status=404)
