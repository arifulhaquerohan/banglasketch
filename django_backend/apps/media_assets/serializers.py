from rest_framework import serializers
from .models import Video, Testimonial

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "youtube_url",
            "description",
            "thumbnail",
            "duration",
            "featured",
            "display_order",
            "published",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = [
            "id",
            "client_name",
            "client_location",
            "quote",
            "rating",
            "client_image",
            "project",
            "cloudinary_id",
            "featured",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
