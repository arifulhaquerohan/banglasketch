from django.urls import re_path
from .views import (
    PublicContactSubmitView,
    PublicNewsletterSubscribeView,
    AdminContactSubmissionListView,
    AdminContactSubmissionDetailView,
    AdminNewsletterListView,
    AdminNewsletterDetailView,
)

contact_public_urlpatterns = [
    re_path(r"^$", PublicContactSubmitView.as_view(), name="public_contact_submit"),
]

newsletter_public_urlpatterns = [
    re_path(r"^$", PublicNewsletterSubscribeView.as_view(), name="public_newsletter_subscribe"),
]

contact_admin_urlpatterns = [
    re_path(r"^$", AdminContactSubmissionListView.as_view(), name="admin_contact_list"),
    re_path(r"^(?P<pk>\d+)/?$", AdminContactSubmissionDetailView.as_view(), name="admin_contact_detail"),
]

newsletter_admin_urlpatterns = [
    re_path(r"^$", AdminNewsletterListView.as_view(), name="admin_newsletter_list"),
    re_path(r"^(?P<pk>\d+)/?$", AdminNewsletterDetailView.as_view(), name="admin_newsletter_detail"),
]

urlpatterns = contact_public_urlpatterns
