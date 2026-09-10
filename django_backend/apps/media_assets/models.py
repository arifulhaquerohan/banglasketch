from django.db import models
from apps.projects.models import Project

class Video(models.Model):
    title = models.CharField(max_length=255)
    youtube_url = models.TextField()
    description = models.TextField(blank=True, null=True)
    thumbnail = models.TextField(blank=True, null=True)
    duration = models.CharField(max_length=20, blank=True, null=True)
    featured = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "videos"
        verbose_name = "Video"
        verbose_name_plural = "Videos"
        ordering = ["display_order", "-id"]

    def __str__(self):
        return self.title


class Testimonial(models.Model):
    client_name = models.CharField(max_length=255)
    client_location = models.CharField(max_length=255, blank=True, null=True)
    quote = models.TextField()
    rating = models.IntegerField(default=5)
    client_image = models.TextField(blank=True, null=True)
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="testimonials",
        db_column="project_id",
    )
    cloudinary_id = models.TextField(blank=True, null=True)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "testimonials"
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.client_name} ({self.rating} stars)"
