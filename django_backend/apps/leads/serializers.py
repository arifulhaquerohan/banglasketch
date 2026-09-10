from rest_framework import serializers
from .models import ContactSubmission, NewsletterSubscriber

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
