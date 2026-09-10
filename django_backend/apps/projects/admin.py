from django.contrib import admin
from .models import Project

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "featured", "published", "date_completed", "client_name", "created_at")
    list_filter = ("category", "featured", "published")
    search_fields = ("title", "description", "client_name", "slug")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Basic Information", {"fields": ("title", "slug", "category", "description")}),
        ("Images & Media", {"fields": ("featured_image", "gallery", "before_image", "after_image", "cloudinary_ids")}),
        ("Client & Timeline", {"fields": ("client_name", "client_testimonial", "date_completed")}),
        ("Publishing", {"fields": ("featured", "published", "deleted_at")}),
        ("Audit", {"fields": ("created_at", "updated_at")}),
    )
