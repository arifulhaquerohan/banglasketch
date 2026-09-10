from rest_framework import serializers
from .models import BlogPost

class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "featured_image",
            "category",
            "meta_description",
            "tags",
            "author",
            "published_date",
            "scheduled_publish_date",
            "reading_time",
            "featured",
            "published",
            "views_count",
            "cloudinary_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "views_count", "created_at", "updated_at"]
