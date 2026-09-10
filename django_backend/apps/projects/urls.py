from django.urls import re_path
from .views import (
    PublicProjectListView,
    PublicProjectDetailView,
    AdminProjectListCreateView,
    AdminProjectDetailUpdateDeleteView,
)

# Public routes: /api/projects
public_urlpatterns = [
    re_path(r"^$", PublicProjectListView.as_view(), name="public_project_list"),
    re_path(r"^(?P<slug>[\w-]+)/?$", PublicProjectDetailView.as_view(), name="public_project_detail"),
]

# Admin routes: /api/admin/projects
admin_urlpatterns = [
    re_path(r"^$", AdminProjectListCreateView.as_view(), name="admin_project_list_create"),
    re_path(r"^(?P<pk>\d+)/?$", AdminProjectDetailUpdateDeleteView.as_view(), name="admin_project_detail_update_delete"),
]

urlpatterns = public_urlpatterns
