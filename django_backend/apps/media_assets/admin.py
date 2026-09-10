from django.contrib import admin
from .models import Video, Testimonial

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "youtube_url", "duration", "display_order", "featured", "published", "created_at")
    list_filter = ("featured", "published")
    search_fields = ("title", "description", "youtube_url")
    readonly_fields = ("created_at",)


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("client_name", "client_location", "rating", "featured", "created_at")
    list_filter = ("rating", "featured")
    search_fields = ("client_name", "quote", "client_location")
    readonly_fields = ("created_at",)
