import time
from django.db import IntegrityError, transaction
from django.conf import settings
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from banglasketch_api.pagination import EnvelopePagination
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from apps.core.services.rate_limit import PostgresRateLimiter
from .availability import is_site_visit_time_bookable
from .models import ContactSubmission, NewsletterSubscriber, ContactEmailJob, SiteVisitBlockedDate, SiteVisitBooking, SiteVisitTimeSlot
from .serializers import ContactSubmissionSerializer, NewsletterSubscriberSerializer, SiteVisitBlockedDateSerializer, SiteVisitBookingSerializer, SiteVisitTimeSlotSerializer

def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def ensure_default_site_visit_slots():
    defaults = [
        ("10:00", "10:00 AM", 10),
        ("12:00", "12:00 PM", 20),
        ("15:00", "3:00 PM", 30),
        ("17:00", "5:00 PM", 40),
    ]
    for value, label, display_order in defaults:
        SiteVisitTimeSlot.objects.get_or_create(
            value=value,
            defaults={"label": label, "display_order": display_order, "active": True},
        )


# Public Contact & Newsletter Views
class PublicContactSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip = get_client_ip(request)

        # Rate limiting: 10 inquiries per 15 minutes (relaxed to 100 in dev)
        max_contact_submits = 10 if not settings.DEBUG else 100
        limiter = PostgresRateLimiter("contact", 15 * 60 * 1000, max_contact_submits)
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

        for field in ("name", "email", "phone", "service_type", "serviceType", "message"):
            if request.data.get(field) is not None and not isinstance(request.data[field], str):
                return Response({"success": False, "error": f"{field} must be text"}, status=400)
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        phone = (request.data.get("phone") or "").strip()
        service_type = (request.data.get("service_type") or request.data.get("serviceType") or "").strip()
        message = (request.data.get("message") or "").strip()

        if not name or not email or not message:
            return Response({"success": False, "error": "Name, email, and message are required"}, status=400)

        if len(name) > 160 or len(email) > 160 or len(phone) > 50 or len(service_type) > 100:
            return Response({"success": False, "error": "One or more fields exceed maximum allowed length"}, status=400)

        if len(message) > 5000:
            return Response({"success": False, "error": "Message exceeds maximum allowed length"}, status=400)

        validated = ContactSubmissionSerializer(data={
            "name": name, "email": email, "phone": phone,
            "service_type": service_type, "message": message,
        })
        if not validated.is_valid():
            return Response({"success": False, "error": validated.errors}, status=400)

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
        email = request.data.get("email", "")
        if not isinstance(email, str):
            return Response({"success": False, "error": "A valid email address is required"}, status=400)
        email = email.strip().lower()
        from rest_framework import serializers
        try:
            email = serializers.EmailField(max_length=255).run_validation(email)
        except serializers.ValidationError:
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


class PublicSiteVisitSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ensure_default_site_visit_slots()
        today = timezone.localdate()
        active_slots = list(SiteVisitTimeSlot.objects.filter(active=True))
        blocked_dates = set(
            SiteVisitBlockedDate.objects.filter(date__gte=today, date__lte=today + timezone.timedelta(days=30))
            .values_list("date", flat=True)
        )
        days = []
        for offset in range(0, 14):
            day = today + timezone.timedelta(days=offset)
            if day.weekday() == 4 or day in blocked_dates:
                continue
            reserved = set(
                SiteVisitBooking.objects.filter(
                    visit_date=day,
                    deleted_at__isnull=True,
                ).exclude(status="cancelled").values_list("time_slot", flat=True)
            )
            slots = []
            for slot in active_slots:
                has_enough_notice = is_site_visit_time_bookable(day, slot.value)
                is_reserved = slot.value in reserved
                slots.append({
                    "value": slot.value,
                    "label": slot.label,
                    "available": has_enough_notice and not is_reserved,
                    "unavailable_reason": (
                        "past" if not has_enough_notice else "reserved" if is_reserved else None
                    ),
                })
            days.append({
                "date": day.isoformat(),
                "label": day.strftime("%a, %d %b"),
                "slots": slots,
            })

        return Response({"success": True, "data": days})


class PublicSiteVisitBookingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ensure_default_site_visit_slots()
        ip = get_client_ip(request)
        max_booking_attempts = 5 if not settings.DEBUG else 50
        limiter = PostgresRateLimiter("site_visit", 15 * 60 * 1000, max_booking_attempts)
        allowed, _, _ = limiter.check_and_increment(ip)
        if not allowed:
            return Response({"success": False, "error": "Too many booking attempts. Please wait a few minutes before trying again."}, status=429)

        serializer = SiteVisitBookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": serializer.errors}, status=400)

        try:
            with transaction.atomic():
                booking = serializer.save()
                ContactEmailJob.objects.get_or_create(site_visit_booking=booking, kind="site_visit_notification")
                ContactEmailJob.objects.get_or_create(site_visit_booking=booking, kind="site_visit_confirmation")
        except IntegrityError:
            if SiteVisitBooking.objects.filter(
                visit_date=serializer.validated_data["visit_date"],
                time_slot=serializer.validated_data["time_slot"], deleted_at__isnull=True,
            ).exclude(status="cancelled").exists():
                return Response({"success": False, "error": "This time slot is already reserved."}, status=409)
            raise
        return Response({
            "success": True,
            "data": SiteVisitBookingSerializer(booking).data,
            "message": "Your site visit request has been reserved. Our team will call to confirm.",
        }, status=201)


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


class AdminSiteVisitBookingListView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        ensure_default_site_visit_slots()
        qs = SiteVisitBooking.objects.filter(deleted_at__isnull=True)
        status_value = request.query_params.get("status")
        if status_value:
            qs = qs.filter(status=status_value)
        serializer = SiteVisitBookingSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


class AdminSiteVisitBookingDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def patch(self, request, pk):
        booking = SiteVisitBooking.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not booking:
            return Response({"success": False, "error": "Booking not found"}, status=404)

        status_value = request.data.get("status")
        if status_value is not None:
            allowed_statuses = [choice[0] for choice in SiteVisitBooking.STATUS_CHOICES]
            if status_value not in allowed_statuses:
                return Response({"success": False, "error": "Invalid booking status"}, status=400)
            if booking.status != status_value:
                now = timezone.now()
                booking.status = status_value
                if status_value == "confirmed":
                    booking.confirmed_at = now
                    booking.last_contacted_at = now
                elif status_value == "completed":
                    booking.completed_at = now
                elif status_value == "cancelled":
                    booking.cancelled_at = now
                    booking.last_contacted_at = now

        if request.data.get("mark_contacted"):
            booking.last_contacted_at = timezone.now()

        if "admin_note" in request.data:
            booking.admin_note = (request.data.get("admin_note") or "").strip()

        if "visit_date" in request.data:
            visit_date = parse_date(str(request.data.get("visit_date") or ""))
            if not visit_date:
                return Response({"success": False, "error": "Invalid visit date"}, status=400)
            today = timezone.localdate()
            max_date = today + timezone.timedelta(days=30)
            if visit_date < today:
                return Response({"success": False, "error": "Please choose today or a future date."}, status=400)
            if visit_date > max_date:
                return Response({"success": False, "error": "Site visits can be reserved up to 30 days ahead."}, status=400)
            if visit_date.weekday() == 4:
                return Response({"success": False, "error": "Friday is unavailable for site visits."}, status=400)
            if SiteVisitBlockedDate.objects.filter(date=visit_date).exists():
                return Response({"success": False, "error": "This date is unavailable for site visits."}, status=400)
            booking.visit_date = visit_date

        if "time_slot" in request.data:
            time_slot = str(request.data.get("time_slot") or "")
            if not SiteVisitTimeSlot.objects.filter(value=time_slot, active=True).exists():
                return Response({"success": False, "error": "This time slot is not available."}, status=400)
            booking.time_slot = time_slot

        duplicate_exists = (
            SiteVisitBooking.objects.filter(
                visit_date=booking.visit_date,
                time_slot=booking.time_slot,
                deleted_at__isnull=True,
            )
            .exclude(pk=booking.pk)
            .exclude(status="cancelled")
            .exists()
        )
        if booking.status != "cancelled" and duplicate_exists:
            return Response({"success": False, "error": "This time slot is already reserved."}, status=409)

        try:
            with transaction.atomic():
                booking.save()
        except IntegrityError:
            if SiteVisitBooking.objects.filter(
                visit_date=booking.visit_date, time_slot=booking.time_slot,
                deleted_at__isnull=True,
            ).exclude(pk=booking.pk).exclude(status="cancelled").exists():
                return Response({"success": False, "error": "This time slot is already reserved."}, status=409)
            raise
        return Response({"success": True, "data": SiteVisitBookingSerializer(booking).data})

    put = patch

    def delete(self, request, pk):
        booking = SiteVisitBooking.objects.filter(pk=pk, deleted_at__isnull=True).first()
        if not booking:
            return Response({"success": False, "error": "Booking not found"}, status=404)
        booking.deleted_at = timezone.now()
        booking.save(update_fields=["deleted_at"])
        return Response({"success": True, "message": "Site visit booking deleted"})


class AdminSiteVisitScheduleView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def get(self, request):
        ensure_default_site_visit_slots()
        slots = SiteVisitTimeSlot.objects.all()
        today = timezone.localdate()
        blocked_dates = SiteVisitBlockedDate.objects.filter(date__gte=today).order_by("date")
        return Response({
            "success": True,
            "data": {
                "slots": SiteVisitTimeSlotSerializer(slots, many=True).data,
                "blocked_dates": SiteVisitBlockedDateSerializer(blocked_dates, many=True).data,
            },
        })


class AdminSiteVisitTimeSlotListView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request):
        serializer = SiteVisitTimeSlotSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": serializer.errors}, status=400)
        slot = serializer.save()
        return Response({"success": True, "data": SiteVisitTimeSlotSerializer(slot).data}, status=201)


class AdminSiteVisitTimeSlotDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def patch(self, request, pk):
        slot = SiteVisitTimeSlot.objects.filter(pk=pk).first()
        if not slot:
            return Response({"success": False, "error": "Time slot not found"}, status=404)
        serializer = SiteVisitTimeSlotSerializer(slot, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({"success": False, "error": serializer.errors}, status=400)
        slot = serializer.save()
        return Response({"success": True, "data": SiteVisitTimeSlotSerializer(slot).data})

    put = patch

    def delete(self, request, pk):
        slot = SiteVisitTimeSlot.objects.filter(pk=pk).first()
        if not slot:
            return Response({"success": False, "error": "Time slot not found"}, status=404)
        if SiteVisitBooking.objects.filter(time_slot=slot.value, deleted_at__isnull=True).exclude(status="cancelled").exists():
            slot.active = False
            slot.save(update_fields=["active"])
            return Response({"success": True, "message": "Time slot disabled because bookings already use it."})
        slot.delete()
        return Response({"success": True, "message": "Time slot deleted"})


class AdminSiteVisitBlockedDateListView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def post(self, request):
        serializer = SiteVisitBlockedDateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": serializer.errors}, status=400)
        blocked_date = serializer.save()
        return Response({"success": True, "data": SiteVisitBlockedDateSerializer(blocked_date).data}, status=201)


class AdminSiteVisitBlockedDateDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("editor")]

    def delete(self, request, pk):
        blocked_date = SiteVisitBlockedDate.objects.filter(pk=pk).first()
        if not blocked_date:
            return Response({"success": False, "error": "Blocked date not found"}, status=404)
        blocked_date.delete()
        return Response({"success": True, "message": "Blocked date removed"})
