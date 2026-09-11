import logging

from django.db import transaction
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .services.knowledge import build_knowledge
from .models import ChatConversation, ChatMessage
from .services.ai import ChatUnavailable, generate_ai_response
from apps.core.services.rate_limit import PostgresRateLimiter
from apps.leads.views import get_client_ip

logger = logging.getLogger(__name__)


class ChatRequestSerializer(serializers.Serializer):
    session_id = serializers.CharField(max_length=64)
    message = serializers.CharField(max_length=4000)


class PublicChatView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # A public welcome gallery: no provider call or conversation is created.
        _, projects = build_knowledge([{"role": "user", "content": "portfolio"}])
        return Response({"success": True, "projects": projects})

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "error": "Please provide a session ID and a message of up to 4,000 characters."}, status=400)
        session_id = serializer.validated_data["session_id"]
        content = serializer.validated_data["message"]
        allowed, _, _ = PostgresRateLimiter("chat", 60_000, 20).check_and_increment(get_client_ip(request))
        if not allowed:
            return Response({"success": False, "error": "Too many messages. Please wait a minute and try again."}, status=429)

        recent = ChatMessage.objects.filter(conversation__session_id=session_id).order_by("-created_at", "-id")[:10]
        messages = [{"role": m.role, "content": m.content} for m in reversed(list(recent))]
        messages.append({"role": "user", "content": content})
        knowledge, projects = build_knowledge(messages)
        try:
            ai_reply = generate_ai_response(messages, knowledge=knowledge)
        except ChatUnavailable as exc:
            logger.warning("Chat provider unavailable: %s", exc)
            return Response({"success": False, "error": "The assistant is temporarily unavailable. Please try again shortly or contact our team."}, status=503)

        # Save the completed exchange together, without holding a transaction
        # open while waiting for the external AI service.
        with transaction.atomic():
            conversation, _ = ChatConversation.objects.get_or_create(session_id=session_id)
            ChatMessage.objects.create(conversation=conversation, role="user", content=content)
            ChatMessage.objects.create(conversation=conversation, role="assistant", content=ai_reply)

        return Response({"success": True, "reply": ai_reply, "message_type": "text", "projects": projects})
