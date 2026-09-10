from django.contrib import admin
from .models import AdminUser, AdminCredential, AdminPasswordReset, LoginHistory

@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ("display_name", "email", "role", "active", "totp_enabled", "last_login_at", "created_at")
    list_filter = ("role", "active", "totp_enabled")
    search_fields = ("display_name", "email")
    readonly_fields = ("created_at", "updated_at", "last_login_at")
    fieldsets = (
        ("Profile", {"fields": ("display_name", "email", "role", "active")}),
        ("Security & Tokens", {"fields": ("password_hash", "token_version", "totp_enabled", "totp_secret", "pending_totp_secret")}),
        ("Audit Timestamps", {"fields": ("last_login_at", "created_at", "updated_at")}),
    )


@admin.register(AdminCredential)
class AdminCredentialAdmin(admin.ModelAdmin):
    list_display = ("id", "version")
    readonly_fields = ("id",)


@admin.register(AdminPasswordReset)
class AdminPasswordResetAdmin(admin.ModelAdmin):
    list_display = ("email", "ip_address", "attempts", "used", "expires_at", "created_at")
    list_filter = ("used",)
    search_fields = ("email", "ip_address")
    readonly_fields = ("created_at",)


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ("email", "success", "ip_address", "created_at")
    list_filter = ("success",)
    search_fields = ("email", "ip_address")
    readonly_fields = ("created_at",)
