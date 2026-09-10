from django.db import models
from django.utils import timezone

class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    excerpt = models.TextField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    featured_image = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    meta_description = models.CharField(max_length=500, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    author = models.CharField(max_length=255, default="Banglasketch Team")
    published_date = models.DateTimeField(default=timezone.now)
    scheduled_publish_date = models.DateTimeField(blank=True, null=True)
    reading_time = models.IntegerField(default=5)
    featured = models.BooleanField(default=False)
    published = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    cloudinary_id = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "blog_posts"
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
        ordering = ["-published_date", "-id"]

    def __str__(self):
        return self.title
