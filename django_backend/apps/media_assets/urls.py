from django.urls import re_path
from .views import (
    PublicVideoListView,
    PublicTestimonialListView,
    AdminVideoListCreateView,
    AdminVideoDetailUpdateDeleteView,
    AdminTestimonialListCreateView,
    AdminTestimonialDetailUpdateDeleteView,
)

# Routes for videos
video_public_urlpatterns = [
    re_path(r"^$", PublicVideoListView.as_view(), name="public_videos_list"),
]

video_admin_urlpatterns = [
    re_path(r"^$", AdminVideoListCreateView.as_view(), name="admin_videos_list_create"),
    re_path(r"^(?P<pk>\d+)/?$", AdminVideoDetailUpdateDeleteView.as_view(), name="admin_videos_detail_update_delete"),
]

# Routes for testimonials
testimonial_public_urlpatterns = [
    re_path(r"^$", PublicTestimonialListView.as_view(), name="public_testimonials_list"),
]

testimonial_admin_urlpatterns = [
    re_path(r"^$", AdminTestimonialListCreateView.as_view(), name="admin_testimonials_list_create"),
    re_path(r"^(?P<pk>\d+)/?$", AdminTestimonialDetailUpdateDeleteView.as_view(), name="admin_testimonials_detail_update_delete"),
]

urlpatterns = video_public_urlpatterns
