from django.contrib import admin
from .models import SiteSetting, AuditLog, ContentVersion, BackgroundJob, RateLimitCounter

@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "updated_at")
    search_fields = ("key",)
    readonly_fields = ("updated_at",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "entity_type", "entity_id", "actor", "ip_address", "created_at")
    list_filter = ("action", "entity_type")
    search_fields = ("entity_type", "entity_id", "ip_address", "request_id")
    readonly_fields = ("created_at",)


@admin.register(ContentVersion)
class ContentVersionAdmin(admin.ModelAdmin):
    list_display = ("entity_type", "entity_id", "version", "actor", "created_at")
    list_filter = ("entity_type",)
    search_fields = ("entity_type", "entity_id")
    readonly_fields = ("created_at",)


@admin.register(BackgroundJob)
class BackgroundJobAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "status", "attempts", "max_attempts", "available_at", "completed_at")
    list_filter = ("status", "kind")
    search_fields = ("kind", "last_error")
    readonly_fields = ("created_at", "locked_at", "completed_at")


@admin.register(RateLimitCounter)
class RateLimitCounterAdmin(admin.ModelAdmin):
    list_display = ("key", "hits", "expires_at")
    search_fields = ("key",)
