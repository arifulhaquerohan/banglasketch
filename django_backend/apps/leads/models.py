from django.db import models

class ContactSubmission(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    service_type = models.CharField(max_length=100, blank=True, null=True)
    message = models.TextField()
    read = models.BooleanField(default=False)
    responded = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "contact_submissions"
        verbose_name = "Contact Submission"
        verbose_name_plural = "Contact Submissions"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.service_type or 'General'}"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(max_length=255, unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "newsletter_subscribers"
        verbose_name = "Newsletter Subscriber"
        verbose_name_plural = "Newsletter Subscribers"
        ordering = ["-subscribed_at"]

    def __str__(self):
        return self.email


class ContactEmailJob(models.Model):
    KIND_CHOICES = (
        ("notification", "Notification"),
        ("confirmation", "Confirmation"),
    )

    id = models.BigAutoField(primary_key=True)
    submission = models.ForeignKey(
        ContactSubmission,
        on_delete=models.CASCADE,
        related_name="email_jobs",
        db_column="submission_id",
    )
    kind = models.CharField(max_length=50, choices=KIND_CHOICES)
    attempts = models.IntegerField(default=0)
    available_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "contact_email_jobs"
        unique_together = (("submission", "kind"),)
        ordering = ["available_at", "id"]

    def __str__(self):
        return f"EmailJob #{self.id} ({self.kind}) for Submission #{self.submission_id}"
