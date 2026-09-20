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


class SiteVisitBooking(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )

    name = models.CharField(max_length=160)
    phone = models.CharField(max_length=50)
    email = models.EmailField(max_length=160, blank=True, null=True)
    location = models.CharField(max_length=255)
    space_size = models.CharField(max_length=120, blank=True, null=True)
    project_note = models.TextField(blank=True, null=True)
    visit_date = models.DateField()
    time_slot = models.CharField(max_length=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_note = models.TextField(blank=True, null=True)
    last_contacted_at = models.DateTimeField(blank=True, null=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    cancelled_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "site_visit_bookings"
        verbose_name = "Site Visit Booking"
        verbose_name_plural = "Site Visit Bookings"
        ordering = ["visit_date", "time_slot", "-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["visit_date", "time_slot"],
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(status="cancelled"),
                name="unique_reserved_site_visit_slot",
            ),
        ]
        indexes = [
            models.Index(fields=["visit_date", "time_slot", "status"]),
            models.Index(fields=["status", "submitted_at"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.visit_date} {self.time_slot} [{self.status}]"


class SiteVisitTimeSlot(models.Model):
    label = models.CharField(max_length=30)
    value = models.CharField(max_length=5, unique=True)
    active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = "site_visit_time_slots"
        ordering = ["display_order", "value"]

    def __str__(self):
        return self.label


class SiteVisitBlockedDate(models.Model):
    date = models.DateField(unique=True)
    reason = models.CharField(max_length=160, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "site_visit_blocked_dates"
        ordering = ["date"]

    def __str__(self):
        return f"{self.date} - {self.reason or 'Blocked'}"


class ContactEmailJob(models.Model):
    KIND_CHOICES = (
        ("notification", "Notification"),
        ("confirmation", "Confirmation"),
        ("site_visit_notification", "Site Visit Notification"),
        ("site_visit_confirmation", "Site Visit Confirmation"),
    )

    id = models.BigAutoField(primary_key=True)
    submission = models.ForeignKey(
        ContactSubmission,
        on_delete=models.CASCADE,
        related_name="email_jobs",
        db_column="submission_id",
        blank=True,
        null=True,
    )
    site_visit_booking = models.ForeignKey(
        SiteVisitBooking,
        on_delete=models.CASCADE,
        related_name="email_jobs",
        db_column="site_visit_booking_id",
        blank=True,
        null=True,
    )
    kind = models.CharField(max_length=50, choices=KIND_CHOICES)
    attempts = models.IntegerField(default=0)
    available_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "contact_email_jobs"
        unique_together = (("submission", "kind"), ("site_visit_booking", "kind"))
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(submission__isnull=False, site_visit_booking__isnull=True,
                             kind__in=["notification", "confirmation"])
                    | models.Q(submission__isnull=True, site_visit_booking__isnull=False,
                               kind__in=["site_visit_notification", "site_visit_confirmation"])
                ),
                name="email_job_target_matches_kind",
            ),
        ]
        ordering = ["available_at", "id"]

    def __str__(self):
        target = f"Submission #{self.submission_id}" if self.submission_id else f"SiteVisit #{self.site_visit_booking_id}"
        return f"EmailJob #{self.id} ({self.kind}) for {target}"
