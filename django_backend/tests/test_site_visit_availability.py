import datetime
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.leads.models import SiteVisitTimeSlot
from apps.leads.serializers import SiteVisitBookingSerializer


@override_settings(SITE_VISIT_MIN_LEAD_MINUTES=120)
class SiteVisitAvailabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        SiteVisitTimeSlot.objects.create(label="12:00 PM", value="12:00", display_order=10)
        SiteVisitTimeSlot.objects.create(label="5:00 PM", value="17:00", display_order=20)
        self.now = timezone.make_aware(datetime.datetime(2026, 9, 14, 15, 30))

    @patch("apps.leads.availability.timezone.now")
    def test_slots_today_respect_dhaka_lead_time(self, mocked_now):
        mocked_now.return_value = self.now
        response = self.client.get("/api/site-visits/slots/")

        self.assertEqual(response.status_code, 200)
        today = response.json()["data"][0]
        slots = {slot["value"]: slot for slot in today["slots"]}
        self.assertFalse(slots["12:00"]["available"])
        self.assertEqual(slots["12:00"]["unavailable_reason"], "past")
        self.assertFalse(slots["17:00"]["available"])
        self.assertEqual(slots["17:00"]["unavailable_reason"], "past")

    @patch("apps.leads.availability.timezone.now")
    def test_serializer_rejects_stale_slot(self, mocked_now):
        mocked_now.return_value = self.now
        serializer = SiteVisitBookingSerializer(data={
            "name": "Test User",
            "phone": "01700000000",
            "location": "Dhaka",
            "visit_date": "2026-09-14",
            "time_slot": "17:00",
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn("time_slot", serializer.errors)
