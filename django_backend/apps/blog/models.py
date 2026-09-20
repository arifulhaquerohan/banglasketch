from django.db import models
from django.utils import timezone

class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    excerpt = models.TextField(blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    featured_image = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    meta_description = models.CharField(max_length=500, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    author = models.CharField(max_length=255, default="Banglasketch Team")
    published_date = models.DateTimeField(default=timezone.now, db_index=True)
    scheduled_publish_date = models.DateTimeField(blank=True, null=True)
    reading_time = models.IntegerField(default=5)
    featured = models.BooleanField(default=False, db_index=True)
    published = models.BooleanField(default=False, db_index=True)
    views_count = models.IntegerField(default=0)
    cloudinary_id = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)

    class Meta:
        db_table = "blog_posts"
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
        ordering = ["-published_date", "-id"]
        indexes = [
            models.Index(fields=["published", "deleted_at", "published_date"], name="blog_pub_del_date_idx"),
            models.Index(fields=["published", "deleted_at", "category"], name="blog_pub_del_cat_idx"),
        ]

    def __str__(self):
        return self.title
