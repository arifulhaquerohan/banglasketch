from rest_framework import serializers
from .models import ChatConversation, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "message_type", "metadata", "created_at"]


class ChatConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(read_only=True)
    last_message = serializers.CharField(read_only=True)

    class Meta:
        model = ChatConversation
        fields = [
            "id", "session_id", "visitor_name", "visitor_phone", "visitor_email",
            "language", "source_page", "status", "contact_submission_id",
            "created_at", "updated_at", "message_count", "last_message",
        ]


class ChatConversationDetailSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatConversation
        fields = [
            "id", "session_id", "visitor_name", "visitor_phone", "visitor_email",
            "language", "source_page", "status", "contact_submission_id",
            "created_at", "updated_at", "messages",
        ]
