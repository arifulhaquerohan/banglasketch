from django.contrib import admin
from .models import BlogPost

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author", "published", "featured", "views_count", "published_date", "reading_time")
    list_filter = ("category", "published", "featured")
    search_fields = ("title", "excerpt", "content", "slug", "author")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("views_count", "created_at", "updated_at")
    fieldsets = (
        ("Article Content", {"fields": ("title", "slug", "category", "excerpt", "content", "featured_image", "tags")}),
        ("SEO & Meta", {"fields": ("meta_description", "reading_time")}),
        ("Author & Scheduling", {"fields": ("author", "published", "featured", "published_date", "scheduled_publish_date")}),
        ("Media & Analytics", {"fields": ("cloudinary_id", "views_count", "deleted_at")}),
        ("Audit", {"fields": ("created_at", "updated_at")}),
    )
