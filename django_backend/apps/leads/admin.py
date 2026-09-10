from django.contrib import admin
from .models import ContactSubmission, NewsletterSubscriber, ContactEmailJob

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "service_type", "read", "responded", "submitted_at")
    list_filter = ("read", "responded", "service_type")
    search_fields = ("name", "email", "phone", "message")
    readonly_fields = ("submitted_at",)


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "active", "subscribed_at")
    list_filter = ("active",)
    search_fields = ("email",)
    readonly_fields = ("subscribed_at",)


@admin.register(ContactEmailJob)
class ContactEmailJobAdmin(admin.ModelAdmin):
    list_display = ("id", "submission", "kind", "attempts", "available_at", "delivered_at")
    list_filter = ("kind",)
    readonly_fields = ("available_at",)
