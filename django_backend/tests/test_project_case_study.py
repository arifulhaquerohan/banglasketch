from django.test import TestCase
from rest_framework.test import APIClient
from apps.authentication.models import AdminUser
from apps.clients.models import Enquiry
from unittest.mock import patch


class ProjectCaseStudyTests(TestCase):
    def setUp(self):
        self.api = APIClient()

    def test_case_study_survives_admin_save_and_public_retrieval(self):
        editor = AdminUser.objects.create(email="case-study@example.com", role="editor", active=True)
        self.api.force_authenticate(user=editor)
        facts = {
            "location": "Banani, Dhaka", "area": "1,200 sq.ft", "style": "Contemporary",
            "scope": "Kitchen renovation", "materials": "Oak and stone", "timeline": "12 weeks",
            "design_challenge": "Bring daylight into the kitchen.",
            "design_solution": "Open the partition and use lighter finishes.",
        }
        result = self.api.post("/api/admin/projects", {
            "title": "A lighter kitchen", "slug": "lighter-kitchen", "category": "kitchen",
            "description": "A kitchen designed for daily life.", "published": True, **facts,
        }, format="json")
        self.assertEqual(result.status_code, 201, result.data)
        self.api.force_authenticate(user=None)
        detail = self.api.get("/api/projects/lighter-kitchen").json()["data"]
        for key, value in facts.items():
            self.assertEqual(detail[key], value)
        summary = self.api.get("/api/projects").json()["data"][0]
        self.assertEqual(summary["location"], facts["location"])
        self.assertEqual(summary["timeline"], facts["timeline"])

    def test_short_enquiry_requires_no_email_or_long_brief(self):
        response = self.api.post("/api/v1/enquiries", {
            "name": "Website visitor", "phone": "+8801700000001",
            "project_location": "Dhaka", "service_scope": "one-room",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        enquiry = Enquiry.objects.get(id=response.json()["data"]["id"])
        self.assertEqual(enquiry.service_scope, "one-room")
        self.assertEqual(enquiry.project_location, "Dhaka")

    @patch("apps.clients.views.PostgresRateLimiter")
    def test_short_enquiry_is_rate_limited(self, limiter):
        limiter.return_value.check_and_increment.return_value = (False, 11, None)
        response = self.api.post("/api/v1/enquiries", {
            "name": "Visitor", "phone": "+8801700000001", "project_location": "Dhaka",
        }, format="json")
        self.assertEqual(response.status_code, 429)
        self.assertFalse(Enquiry.objects.exists())
