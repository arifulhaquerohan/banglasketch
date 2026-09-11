from django.db import models
from apps.leads.models import ContactSubmission


class ChatConversation(models.Model):
    STATUS_CHOICES = (
        ("active", "Active"),
        ("consultation_requested", "Consultation Requested"),
        ("closed", "Closed"),
    )

    id = models.BigAutoField(primary_key=True)
    session_id = models.CharField(max_length=64, unique=True, db_index=True)
    visitor_name = models.CharField(max_length=255, blank=True, null=True)
    visitor_phone = models.CharField(max_length=50, blank=True, null=True)
    visitor_email = models.EmailField(max_length=255, blank=True, null=True)
    language = models.CharField(max_length=10, default="auto")
    source_page = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="active")
    contact_submission = models.ForeignKey(
        ContactSubmission,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="chat_conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_conversations"
        verbose_name = "Chat Conversation"
        verbose_name_plural = "Chat Conversations"
        ordering = ["-updated_at"]

    def __str__(self):
        name = self.visitor_name or "Anonymous"
        return f"Chat #{self.id} — {name} ({self.status})"


class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    )
    TYPE_CHOICES = (
        ("text", "Text"),
        ("quick_reply", "Quick Reply"),
        ("consultation_form", "Consultation Form"),
        ("project_card", "Project Card"),
        ("whatsapp_link", "WhatsApp Link"),
    )

    id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="text")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        ordering = ["created_at"]

    def __str__(self):
        preview = self.content[:60] + "..." if len(self.content) > 60 else self.content
        return f"[{self.role}] {preview}"
