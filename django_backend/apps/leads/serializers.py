import re
from django.utils import timezone
from rest_framework import serializers
from .availability import is_site_visit_time_bookable
from .models import ContactSubmission, NewsletterSubscriber, SiteVisitBlockedDate, SiteVisitBooking, SiteVisitTimeSlot

class ContactSubmissionSerializer(serializers.ModelSerializer):
    service = serializers.CharField(source="service_type", read_only=True)

    class Meta:
        model = ContactSubmission
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "service_type",
            "service",
            "message",
            "read",
            "responded",
            "submitted_at",
        ]
        read_only_fields = ["id", "submitted_at"]


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "active", "subscribed_at"]
        read_only_fields = ["id", "subscribed_at"]


class SiteVisitBookingSerializer(serializers.ModelSerializer):
    time_slot_label = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SiteVisitBooking
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "location",
            "space_size",
            "project_note",
            "visit_date",
            "time_slot",
            "time_slot_label",
            "status",
            "status_label",
            "admin_note",
            "last_contacted_at",
            "confirmed_at",
            "completed_at",
            "cancelled_at",
            "submitted_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "admin_note",
            "last_contacted_at",
            "confirmed_at",
            "completed_at",
            "cancelled_at",
            "submitted_at",
            "updated_at",
        ]

    def validate_visit_date(self, value):
        today = timezone.localdate()
        max_date = today + timezone.timedelta(days=30)
        if value < today:
            raise serializers.ValidationError("Please choose today or a future date.")
        if value > max_date:
            raise serializers.ValidationError("Site visits can be reserved up to 30 days ahead.")
        if value.weekday() == 4:
            raise serializers.ValidationError("Friday is unavailable for site visits.")
        if SiteVisitBlockedDate.objects.filter(date=value).exists():
            raise serializers.ValidationError("This date is unavailable for site visits.")
        return value

    def validate(self, attrs):
        visit_date = attrs.get("visit_date")
        time_slot = attrs.get("time_slot")
        phone = (attrs.get("phone") or "").strip()
        if visit_date and time_slot:
            if not SiteVisitTimeSlot.objects.filter(value=time_slot, active=True).exists():
                raise serializers.ValidationError({"time_slot": "This time slot is not available."})
            if not is_site_visit_time_bookable(visit_date, time_slot):
                raise serializers.ValidationError({
                    "time_slot": "This time has passed or is too close. Please choose a later slot."
                })
            exists = SiteVisitBooking.objects.filter(
                visit_date=visit_date,
                time_slot=time_slot,
                deleted_at__isnull=True,
            ).exclude(status="cancelled").exists()
            if exists:
                raise serializers.ValidationError({"time_slot": "This time slot is already reserved."})
        if phone:
            recent_duplicate = SiteVisitBooking.objects.filter(
                phone=phone,
                visit_date__gte=timezone.localdate(),
                deleted_at__isnull=True,
            ).exclude(status__in=["cancelled", "completed"]).exists()
            if recent_duplicate:
                raise serializers.ValidationError({"phone": "You already have an active site visit request. Please call us to change it."})
        return attrs

    def get_time_slot_label(self, obj):
        slot = SiteVisitTimeSlot.objects.filter(value=obj.time_slot).first()
        return slot.label if slot else obj.time_slot


class SiteVisitTimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteVisitTimeSlot
        fields = ["id", "label", "value", "active", "display_order"]
        read_only_fields = ["id"]

    def validate_value(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Time value is required.")
        if not re.fullmatch(r"(?:[01][0-9]|2[0-3]):[0-5][0-9]", value):
            raise serializers.ValidationError("Use HH:MM format, for example 10:00.")
        return value


class SiteVisitBlockedDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteVisitBlockedDate
        fields = ["id", "date", "reason", "created_at"]
        read_only_fields = ["id", "created_at"]
