from django.db import models
from apps.authentication.models import AdminUser

class SiteSetting(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "site_settings"
        verbose_name = "Site Setting"
        verbose_name_plural = "Site Settings"

    def __str__(self):
        return self.key


class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    actor = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        db_column="actor_id",
    )
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=100, null=True, blank=True)
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    ip_address = models.CharField(max_length=255, null=True, blank=True)
    request_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} on {self.entity_type}:{self.entity_id} at {self.created_at}"


class ContentVersion(models.Model):
    id = models.BigAutoField(primary_key=True)
    entity_type = models.CharField(max_length=100)
    entity_id = models.IntegerField()
    version = models.IntegerField()
    snapshot = models.JSONField()
    actor = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="content_versions",
        db_column="actor_id",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "content_versions"
        unique_together = (("entity_type", "entity_id", "version"),)
        ordering = ["-version"]

    def __str__(self):
        return f"{self.entity_type} #{self.entity_id} v{self.version}"


class BackgroundJob(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )

    id = models.BigAutoField(primary_key=True)
    kind = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, default="pending", choices=STATUS_CHOICES)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=8)
    available_at = models.DateTimeField(auto_now_add=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "background_jobs"
        ordering = ["available_at", "id"]

    def __str__(self):
        return f"Job {self.id}: {self.kind} ({self.status})"


class RateLimitCounter(models.Model):
    key = models.CharField(max_length=255, primary_key=True)
    hits = models.IntegerField(default=0)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "rate_limit_counters"

    def __str__(self):
        return f"{self.key}: {self.hits} hits"
