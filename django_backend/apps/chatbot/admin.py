from django.contrib import admin
from .models import ChatConversation, ChatMessage


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ["role", "content", "message_type", "metadata", "created_at"]
    ordering = ["created_at"]


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "visitor_name", "visitor_phone", "status", "language", "created_at"]
    list_filter = ["status", "language"]
    search_fields = ["visitor_name", "visitor_email", "visitor_phone", "session_id"]
    readonly_fields = ["session_id", "created_at", "updated_at"]
    inlines = [ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "conversation", "role", "message_type", "created_at"]
    list_filter = ["role", "message_type"]
    search_fields = ["content"]
    readonly_fields = ["created_at"]
