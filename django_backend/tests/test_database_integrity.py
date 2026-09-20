import datetime
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.db import IntegrityError, transaction
from django.test import TestCase, SimpleTestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.leads.models import ContactEmailJob, ContactSubmission, SiteVisitBooking, SiteVisitTimeSlot
from apps.leads.serializers import SiteVisitBookingSerializer, SiteVisitTimeSlotSerializer


class DatabaseIntegrityTests(TestCase):
    def setUp(self):
        self.day = timezone.localdate() + datetime.timedelta(days=1)
        while self.day.weekday() == 4:
            self.day += datetime.timedelta(days=1)
        self.data = dict(name="Test", phone="01700000000", location="Dhaka",
                         visit_date=self.day, time_slot="10:00")
        SiteVisitTimeSlot.objects.create(value="10:00", label="10 AM")

    def test_stale_validation_cannot_double_book(self):
        first = SiteVisitBookingSerializer(data=self.data)
        second = SiteVisitBookingSerializer(data={**self.data, "phone": "01800000000"})
        self.assertTrue(first.is_valid(), first.errors)
        self.assertTrue(second.is_valid(), second.errors)
        first.save()
        with self.assertRaises(IntegrityError), transaction.atomic():
            second.save()
        self.assertEqual(SiteVisitBooking.objects.count(), 1)

    def test_cancelled_and_deleted_bookings_release_slot(self):
        SiteVisitBooking.objects.create(**self.data, status="cancelled")
        SiteVisitBooking.objects.create(**self.data, deleted_at=timezone.now())
        SiteVisitBooking.objects.create(**self.data)
        self.assertEqual(SiteVisitBooking.objects.count(), 3)

    def test_api_handles_booking_that_arrives_after_validation(self):
        original_validate = SiteVisitBookingSerializer.is_valid

        def validate_then_compete(serializer, *args, **kwargs):
            result = original_validate(serializer, *args, **kwargs)
            if result:
                SiteVisitBooking.objects.create(**{**self.data, "phone": "01800000000"})
            return result

        with patch.object(SiteVisitBookingSerializer, "is_valid", validate_then_compete):
            response = APIClient().post("/api/site-visits/", self.data, format="json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(SiteVisitBooking.objects.count(), 1)
        self.assertEqual(ContactEmailJob.objects.count(), 0)

    def test_reactivating_cancelled_booking_cannot_double_book(self):
        cancelled = SiteVisitBooking.objects.create(**self.data, status="cancelled")
        SiteVisitBooking.objects.create(**self.data)
        with self.assertRaises(IntegrityError), transaction.atomic():
            SiteVisitBooking.objects.filter(pk=cancelled.pk).update(status="confirmed")

    def test_email_jobs_require_correct_single_target(self):
        submission = ContactSubmission.objects.create(name="Test", email="test@example.com", message="Test")
        booking = SiteVisitBooking.objects.create(**self.data)
        invalid = [
            dict(kind="notification"),
            dict(kind="notification", submission=submission, site_visit_booking=booking),
            dict(kind="site_visit_notification", submission=submission),
            dict(kind="confirmation", site_visit_booking=booking),
            dict(kind="unknown", submission=submission),
        ]
        for fields in invalid:
            with self.subTest(fields=fields), self.assertRaises(IntegrityError), transaction.atomic():
                ContactEmailJob.objects.create(**fields)
        ContactEmailJob.objects.create(kind="notification", submission=submission)
        ContactEmailJob.objects.create(kind="site_visit_confirmation", site_visit_booking=booking)

    def test_contact_rejects_values_exceeding_database_columns(self):
        client = APIClient()
        for extra in ({"phone": "1" * 51}, {"service_type": "x" * 101}, {"email": "invalid"}):
            response = client.post("/api/contact", {
                "name": "Test", "email": "test@example.com", "message": "Test", **extra,
            }, format="json")
            self.assertEqual(response.status_code, 400)
        self.assertEqual(ContactSubmission.objects.count(), 0)

    def test_time_slots_reject_invalid_clock_values(self):
        for value in ("24:00", "12:60", "99:99", "10:00x"):
            serializer = SiteVisitTimeSlotSerializer(data={"value": value, "label": "Invalid"})
            self.assertFalse(serializer.is_valid())

    def test_newsletter_rejects_invalid_or_oversized_email(self):
        for email in ([], "bad@", "a" * 256 + "@example.com"):
            response = APIClient().post("/api/newsletter", {"email": email}, format="json")
            self.assertEqual(response.status_code, 400)


class DatabaseSecurityTests(SimpleTestCase):
    def test_postgres_backup_uses_tls_and_round_trips(self):
        from scripts import backup, verify_backup
        env = {
            "DATABASE_URL": "postgresql://user:p%40ss@host/db",
            "DB_SSL_MODE": "verify-full", "DB_SSL_CA_FILE": "/test/ca.pem",
            "BACKUP_ENCRYPTION_KEY": "test-only-backup-secret",
        }
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, env, clear=True):
            with patch.object(backup.subprocess, "run") as run:
                run.return_value.stdout = b"-- PostgreSQL database dump\nSELECT 1;\n"
                path = backup.create_backup(Path(directory))
            process_env = run.call_args.kwargs["env"]
            self.assertEqual(process_env["PGPASSWORD"], "p@ss")
            self.assertEqual(process_env["PGSSLMODE"], "verify-full")
            self.assertEqual(process_env["PGSSLROOTCERT"], "/test/ca.pem")
            self.assertTrue(verify_backup.verify_backup(path))

    def test_backups_require_explicit_secret(self):
        from scripts import backup, verify_backup
        for module in (backup, verify_backup):
            with patch.dict(os.environ, {}, clear=True), self.assertRaises(ValueError):
                module.get_backup_key()

    def test_database_url_validation_and_encoded_credentials(self):
        for module in ("config.settings.base", "banglasketch_api.settings"):
            for url, succeeds in (("mysql://user:pass@host/db", False),
                                  ("postgresql://user:p%40ss%2Fword@host/db", True)):
                code = (
                    f"import {module} as s; "
                    "assert s.DATABASES['default']['PASSWORD'] == 'p@ss/word'"
                )
                env = {**os.environ, "PYTHON_DOTENV_DISABLED": "1", "NODE_ENV": "development", "DATABASE_URL": url}
                result = subprocess.run([sys.executable, "-c", code], env=env,
                                        cwd=Path(__file__).resolve().parents[1], capture_output=True)
                self.assertEqual(result.returncode == 0, succeeds)
