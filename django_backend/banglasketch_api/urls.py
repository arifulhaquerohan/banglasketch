from django.contrib import admin
from django.urls import path, re_path, include

from apps.projects.urls import (
    public_urlpatterns as projects_public,
    admin_urlpatterns as projects_admin,
)
from apps.blog.urls import (
    public_urlpatterns as blog_public,
    admin_urlpatterns as blog_admin,
)
from apps.media_assets.urls import (
    video_public_urlpatterns,
    video_admin_urlpatterns,
    testimonial_public_urlpatterns,
    testimonial_admin_urlpatterns,
)
from apps.leads.urls import (
    contact_public_urlpatterns,
    newsletter_public_urlpatterns,
    contact_admin_urlpatterns,
    newsletter_admin_urlpatterns,
)
from apps.clients.urls import (
    portal_public_urlpatterns,
    client_handling_admin_urlpatterns,
    enquiries_public_urlpatterns,
)
from apps.core.urls import (
    core_public_urlpatterns,
    core_admin_urlpatterns,
)

# Admin API url patterns
admin_api_urlpatterns = [
    re_path(r"^projects(?:/|$)", include(projects_admin)),
    re_path(r"^blog(?:/|$)", include(blog_admin)),
    re_path(r"^videos(?:/|$)", include(video_admin_urlpatterns)),
    re_path(r"^testimonials(?:/|$)", include(testimonial_admin_urlpatterns)),
    re_path(r"^contacts(?:/|$)", include(contact_admin_urlpatterns)),
    re_path(r"^newsletter(?:/|$)", include(newsletter_admin_urlpatterns)),
    re_path(r"^", include(client_handling_admin_urlpatterns)),
    re_path(r"^", include(core_admin_urlpatterns)),
    re_path(r"^", include("apps.authentication.urls")),
]

def get_public_api_urlpatterns():
    return [
        re_path(r"^projects(?:/|$)", include(projects_public)),
        re_path(r"^blog(?:/|$)", include(blog_public)),
        re_path(r"^videos(?:/|$)", include(video_public_urlpatterns)),
        re_path(r"^testimonials(?:/|$)", include(testimonial_public_urlpatterns)),
        re_path(r"^contact(?:/|$)", include(contact_public_urlpatterns)),
        re_path(r"^newsletter(?:/|$)", include(newsletter_public_urlpatterns)),
        re_path(r"^enquiries(?:/|$)", include(enquiries_public_urlpatterns)),
        re_path(r"^portal(?:/|$)", include(portal_public_urlpatterns)),
    ]

urlpatterns = [
    # Built-in Django Admin Interface
    path("django-admin/", admin.site.urls),

    # Health Checks
    re_path(r"^api/", include(core_public_urlpatterns)),
    re_path(r"^", include(core_public_urlpatterns)),

    # Public API Endpoints (/api/ and legacy /api/v1/)
    re_path(r"^api/", include(get_public_api_urlpatterns())),
    re_path(r"^api/v1/", include(get_public_api_urlpatterns())),

    # Admin CMS API Endpoints
    re_path(r"^api/admin/", include(admin_api_urlpatterns)),
]
