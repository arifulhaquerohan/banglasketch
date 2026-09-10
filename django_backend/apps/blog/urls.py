from django.urls import re_path
from .views import (
    PublicBlogPostListView,
    PublicBlogPostDetailView,
    AdminBlogPostListCreateView,
    AdminBlogPostDetailUpdateDeleteView,
)

# Public routes: /api/blog
public_urlpatterns = [
    re_path(r"^$", PublicBlogPostListView.as_view(), name="public_blog_list"),
    re_path(r"^(?P<slug>[\w-]+)/?$", PublicBlogPostDetailView.as_view(), name="public_blog_detail"),
]

# Admin routes: /api/admin/blog
admin_urlpatterns = [
    re_path(r"^$", AdminBlogPostListCreateView.as_view(), name="admin_blog_list_create"),
    re_path(r"^(?P<pk>\d+)/?$", AdminBlogPostDetailUpdateDeleteView.as_view(), name="admin_blog_detail_update_delete"),
]

urlpatterns = public_urlpatterns
