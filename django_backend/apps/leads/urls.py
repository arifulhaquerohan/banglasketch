from django.urls import re_path
from .views import (
    PublicContactSubmitView,
    PublicNewsletterSubscribeView,
    PublicSiteVisitSlotsView,
    PublicSiteVisitBookingView,
    AdminContactSubmissionListView,
    AdminContactSubmissionDetailView,
    AdminNewsletterListView,
    AdminNewsletterDetailView,
    AdminSiteVisitScheduleView,
    AdminSiteVisitBookingListView,
    AdminSiteVisitBookingDetailView,
    AdminSiteVisitTimeSlotListView,
    AdminSiteVisitTimeSlotDetailView,
    AdminSiteVisitBlockedDateListView,
    AdminSiteVisitBlockedDateDetailView,
)

contact_public_urlpatterns = [
    re_path(r"^$", PublicContactSubmitView.as_view(), name="public_contact_submit"),
]

newsletter_public_urlpatterns = [
    re_path(r"^$", PublicNewsletterSubscribeView.as_view(), name="public_newsletter_subscribe"),
]

site_visit_public_urlpatterns = [
    re_path(r"^slots/?$", PublicSiteVisitSlotsView.as_view(), name="public_site_visit_slots"),
    re_path(r"^$", PublicSiteVisitBookingView.as_view(), name="public_site_visit_booking"),
]

contact_admin_urlpatterns = [
    re_path(r"^$", AdminContactSubmissionListView.as_view(), name="admin_contact_list"),
    re_path(r"^(?P<pk>\d+)/?$", AdminContactSubmissionDetailView.as_view(), name="admin_contact_detail"),
]

newsletter_admin_urlpatterns = [
    re_path(r"^$", AdminNewsletterListView.as_view(), name="admin_newsletter_list"),
    re_path(r"^(?P<pk>\d+)/?$", AdminNewsletterDetailView.as_view(), name="admin_newsletter_detail"),
]

site_visit_admin_urlpatterns = [
    re_path(r"^schedule/?$", AdminSiteVisitScheduleView.as_view(), name="admin_site_visit_schedule"),
    re_path(r"^slots/?$", AdminSiteVisitTimeSlotListView.as_view(), name="admin_site_visit_slots"),
    re_path(r"^slots/(?P<pk>\d+)/?$", AdminSiteVisitTimeSlotDetailView.as_view(), name="admin_site_visit_slot_detail"),
    re_path(r"^blocked-dates/?$", AdminSiteVisitBlockedDateListView.as_view(), name="admin_site_visit_blocked_dates"),
    re_path(r"^blocked-dates/(?P<pk>\d+)/?$", AdminSiteVisitBlockedDateDetailView.as_view(), name="admin_site_visit_blocked_date_detail"),
    re_path(r"^$", AdminSiteVisitBookingListView.as_view(), name="admin_site_visit_list"),
    re_path(r"^(?P<pk>\d+)/?$", AdminSiteVisitBookingDetailView.as_view(), name="admin_site_visit_detail"),
]

urlpatterns = contact_public_urlpatterns
