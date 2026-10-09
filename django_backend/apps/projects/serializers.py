from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "location",
            "area",
            "style",
            "scope",
            "materials",
            "timeline",
            "design_challenge",
            "design_solution",
            "category",
            "featured_image",
            "gallery",
            "before_image",
            "after_image",
            "client_name",
            "client_testimonial",
            "date_completed",
            "featured",
            "published",
            "cloudinary_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
