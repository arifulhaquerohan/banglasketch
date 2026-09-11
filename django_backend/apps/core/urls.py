from django.urls import path, re_path
from .views import (
    HealthCheckView,
    HealthLiveView,
    HealthReadyView,
    AdminDashboardStatsView,
    AdminSettingsView,
    AdminAuditLogsView,
    AdminUploadView,
    AdminCloudinarySignView,
    AdminRestoreView,
    AdminVersionHistoryView,
    AdminPermanentDeleteView,
)

core_public_urlpatterns = [
    re_path(r"^health/?$", HealthCheckView.as_view(), name="health_check"),
    re_path(r"^health/live/?$", HealthLiveView.as_view(), name="health_live"),
    re_path(r"^health/ready/?$", HealthReadyView.as_view(), name="health_ready"),
]

core_admin_urlpatterns = [
    re_path(r"^(?:dashboard-)?stats/?$", AdminDashboardStatsView.as_view(), name="admin_dashboard_stats"),
    re_path(r"^settings(?:/(?P<key>[\w.-]+))?/?$", AdminSettingsView.as_view(), name="admin_settings"),
    re_path(r"^audit(?:-logs)?/?$", AdminAuditLogsView.as_view(), name="admin_audit_logs"),
    re_path(r"^upload/?$", AdminUploadView.as_view(), name="admin_upload"),
    re_path(r"^cloudinary-sign/?$", AdminCloudinarySignView.as_view(), name="admin_cloudinary_sign"),
    re_path(r"^restore/(?P<entity>[\w-]+)/(?P<id>\d+)/?$", AdminRestoreView.as_view(), name="admin_restore"),
    re_path(r"^versions/(?P<entity>[\w-]+)/(?P<id>\d+)/?$", AdminVersionHistoryView.as_view(), name="admin_version_history"),
    re_path(r"^trash/(?P<entity>[\w-]+)/(?P<id>\d+)/?$", AdminPermanentDeleteView.as_view(), name="admin_permanent_delete"),
]

urlpatterns = core_public_urlpatterns
