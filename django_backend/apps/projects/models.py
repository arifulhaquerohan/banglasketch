from django.db import models

class Project(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50)
    featured_image = models.TextField(blank=True, null=True)
    gallery = models.JSONField(default=list, blank=True)
    before_image = models.TextField(blank=True, null=True)
    after_image = models.TextField(blank=True, null=True)
    client_name = models.CharField(max_length=255, blank=True, null=True)
    client_testimonial = models.TextField(blank=True, null=True)
    date_completed = models.DateField(blank=True, null=True)
    featured = models.BooleanField(default=False)
    published = models.BooleanField(default=True)
    cloudinary_ids = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "projects"
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.title} ({self.category})"
