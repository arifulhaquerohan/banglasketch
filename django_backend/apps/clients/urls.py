from django.urls import re_path
from .views import (
    PublicPortalView,
    PublicPortalProposalDecisionView,
    PublicPortalChangeOrderDecisionView,
    PublicEnquiryCreateView,
    AdminClientDashboardView,
    AdminEnquiryPipelineView,
    AdminClientListCreateView,
    AdminClientDetailUpdateDeleteView,
    AdminEnquiryListCreateView,
    AdminEnquiryDetailUpdateDeleteView,
    AdminEnquiryFollowUpCreateView,
    AdminEnquiryConvertToProjectView,
    AdminClientProjectListCreateView,
    AdminClientProjectDetailUpdateDeleteView,
    AdminProposalCreateView,
    AdminProposalVersionCreateView,
    AdminProposalApproveView,
    AdminChangeOrderCreateView,
    AdminChangeOrderDecisionView,
)

# Public routes: /api/portal/<token>...
portal_public_urlpatterns = [
    re_path(r"^(?P<token>[\w-]+)/proposals/(?P<proposal_id>\d+)/decision/?$", PublicPortalProposalDecisionView.as_view(), name="portal_proposal_decision"),
    re_path(r"^(?P<token>[\w-]+)/change-orders/(?P<change_order_id>\d+)/decision/?$", PublicPortalChangeOrderDecisionView.as_view(), name="portal_change_order_decision"),
    re_path(r"^(?P<token>[\w-]+)/?$", PublicPortalView.as_view(), name="portal_detail"),
]

# Public routes: /api/enquiries
enquiries_public_urlpatterns = [
    re_path(r"^$", PublicEnquiryCreateView.as_view(), name="public_enquiry_create"),
]

# Admin routes: under /api/admin/
# In banglasketch_api/urls.py, these are included under /api/admin/
client_handling_admin_urlpatterns = [
    # Dashboard & Pipeline
    re_path(r"^client-handling/dashboard/?$", AdminClientDashboardView.as_view(), name="admin_client_handling_dashboard"),
    re_path(r"^enquiries/pipeline/?$", AdminEnquiryPipelineView.as_view(), name="admin_enquiry_pipeline"),

    # Enquiries
    re_path(r"^enquiries/?$", AdminEnquiryListCreateView.as_view(), name="admin_enquiries_list_create"),
    re_path(r"^enquiries/(?P<pk>\d+)/?$", AdminEnquiryDetailUpdateDeleteView.as_view(), name="admin_enquiry_detail_update_delete"),
    re_path(r"^enquiries/(?P<enquiry_id>\d+)/follow-ups/?$", AdminEnquiryFollowUpCreateView.as_view(), name="admin_enquiry_follow_up_create"),
    re_path(r"^enquiries/(?P<id>\d+)/convert-to-project/?$", AdminEnquiryConvertToProjectView.as_view(), name="admin_enquiry_convert_to_project"),

    # Clients
    re_path(r"^clients/?$", AdminClientListCreateView.as_view(), name="admin_clients_list_create"),
    re_path(r"^clients/(?P<pk>\d+)/?$", AdminClientDetailUpdateDeleteView.as_view(), name="admin_client_detail_update_delete"),

    # Client Projects
    re_path(r"^client-projects/?$", AdminClientProjectListCreateView.as_view(), name="admin_client_projects_list_create"),
    re_path(r"^client-projects/(?P<pk>\d+)/?$", AdminClientProjectDetailUpdateDeleteView.as_view(), name="admin_client_project_detail_update_delete"),
    re_path(r"^client-projects/(?P<id>\d+)/proposals/?$", AdminProposalCreateView.as_view(), name="admin_proposal_create"),
    re_path(r"^client-projects/(?P<id>\d+)/change-orders/?$", AdminChangeOrderCreateView.as_view(), name="admin_change_order_create"),

    # Proposals & Change Orders individual endpoints
    re_path(r"^proposals/(?P<id>\d+)/versions/?$", AdminProposalVersionCreateView.as_view(), name="admin_proposal_version_create"),
    re_path(r"^proposals/(?P<id>\d+)/approve/?$", AdminProposalApproveView.as_view(), name="admin_proposal_approve"),
    re_path(r"^change-orders/(?P<id>\d+)/decision/?$", AdminChangeOrderDecisionView.as_view(), name="admin_change_order_decision"),
]

urlpatterns = portal_public_urlpatterns
