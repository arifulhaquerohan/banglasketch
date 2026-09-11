from django.urls import re_path
from .views import PublicChatView

urlpatterns = [
    re_path(r"^$", PublicChatView.as_view(), name="public_chat"),
]
