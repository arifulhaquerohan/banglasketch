import base64
from decimal import Decimal
from io import BytesIO
from unittest.mock import patch, Mock
from uuid import uuid4
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from PIL import Image
from apps.authentication.models import AdminUser
from apps.core.models import Invoice, InvoiceRevision
from apps.core.invoice_serializers import InvoiceSerializer
from apps.core.services.invoice_pdf import invoice_totals, render_invoice_pdf


def sample_invoice():
    return dict(id=str(uuid4()), revision=0, number="BS-TEST-001", issued="2026-09-20", due="2026-09-30",
        company="Bangla Sketch", address="Dhaka", phone="01712-458794", email="info@banglasketch.com",
        client="Sample Client", clientCompany="", clientAddress="Dhaka", clientPhone="", clientEmail="",
        project="Interior Design", location="Dhaka", notes="", payment="Bank transfer", terms="Pay by due date.",
        discount=10, tax=15, paid=1000, items=[dict(description="Design", quantity=2, rate=1250)],
        signature="", signatory="Studio Director", signatoryTitle="Authorized signatory", signatureEnabled=True, clientSignature=True)


@override_settings(CLOUDINARY_CLOUD_NAME="test", CLOUDINARY_API_KEY="test", CLOUDINARY_API_SECRET="test")
class InvoiceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = AdminUser.objects.create(email="invoice-test@example.com", role="admin", active=True)
        self.client.force_authenticate(self.admin)
        self.data = sample_invoice()

    def save(self):
        return self.client.post("/api/admin/invoices", self.data, format="json")

    def test_validation_rejects_invalid_money_dates_signature_and_numbers(self):
        for changes in ({"discount":101}, {"paid":-1}, {"due":"2026-09-01"}, {"signature":"https://example.com/sign.png"},
                        {"number":"bad<script>"}, {"items":[]}, {"items":[{"description":"Design", "quantity":-1,"rate":10}]}):
            serializer = InvoiceSerializer(data={**self.data, **changes})
            self.assertFalse(serializer.is_valid(), changes)

    def test_signature_is_validated_and_metadata_is_removed(self):
        from PIL.PngImagePlugin import PngInfo
        output = BytesIO()
        metadata = PngInfo(); metadata.add_text("private", "remove me")
        Image.new("RGBA", (20, 10)).save(output, "PNG", pnginfo=metadata)
        serializer = InvoiceSerializer(data={**self.data, "signature":"data:image/png;base64," + base64.b64encode(output.getvalue()).decode()})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        normalized = base64.b64decode(serializer.validated_data["signature"].split(",")[1])
        self.assertNotIn(b"remove me", normalized)

    def test_decimal_totals_discount_before_tax(self):
        totals = invoice_totals(self.data)
        self.assertEqual(totals["discount"], Decimal("250.00"))
        self.assertEqual(totals["tax"], Decimal("337.50"))
        self.assertEqual(totals["due"], Decimal("1587.50"))

    @patch("apps.core.invoice_views.cloudinary.uploader.upload")
    @patch("apps.core.invoice_views.render_invoice_pdf", return_value=b"%PDF-test")
    def test_private_cloud_archive_deduplication_conflicts_and_retrieval(self, render, upload):
        upload.return_value = {"public_id":"banglasketch/invoices/test/file.pdf"}
        response = self.save()
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["data"]["cloudSaved"])
        self.assertEqual(response.data["data"]["revision"], 1)
        self.assertEqual(upload.call_args.kwargs["type"], "authenticated")
        self.assertEqual(upload.call_args.kwargs["resource_type"], "raw")
        self.assertFalse(upload.call_args.kwargs["overwrite"])
        self.assertEqual(InvoiceRevision.objects.count(), 1)
        self.data["revision"] = 1
        self.assertEqual(self.save().status_code, 200)
        self.assertEqual(upload.call_count, 1)
        self.data["notes"] = "Updated scope"
        self.assertEqual(self.save().data["data"]["revision"], 2)
        self.assertEqual(InvoiceRevision.objects.count(), 2)
        self.assertEqual(self.save().status_code, 409)
        record = self.client.get(f'/api/admin/invoices/{self.data["id"]}')
        self.assertEqual(record.data["data"]["notes"], "Updated scope")
        self.assertNotIn("signature", self.client.get("/api/admin/invoices").data["data"][0])
        with patch("apps.core.invoice_views.requests.get") as get:
            get.return_value = Mock(content=b"%PDF-stored", raise_for_status=lambda:None)
            pdf = self.client.get(f'/api/admin/invoices/{self.data["id"]}/pdf')
            self.assertEqual(pdf.content, b"%PDF-stored")
            self.assertEqual(pdf["Cache-Control"], "private, no-store")
            self.assertIn("expires_at=", get.call_args.args[0])

    @patch("apps.core.invoice_views.cloudinary.uploader.upload", side_effect=RuntimeError("provider-private-details"))
    @patch("apps.core.invoice_views.render_invoice_pdf", return_value=b"%PDF-test")
    def test_cloud_failure_does_not_create_false_saved_invoice(self, render, upload):
        response = self.save()
        self.assertEqual(response.status_code, 502)
        self.assertEqual(Invoice.objects.count(), 0)
        self.assertEqual(InvoiceRevision.objects.count(), 0)
        self.assertNotIn("provider-private-details", str(response.data))

    @patch("apps.core.invoice_views.cloudinary.uploader.upload")
    @patch("apps.core.invoice_views.render_invoice_pdf", return_value=b"%PDF-test")
    def test_failed_update_preserves_previous_version(self, render, upload):
        upload.return_value = {"public_id":"banglasketch/invoices/test/file.pdf"}
        self.assertEqual(self.save().status_code, 200)
        self.data.update(revision=1, notes="Unsaved change")
        upload.side_effect = RuntimeError("Unavailable")
        self.assertEqual(self.save().status_code, 502)
        saved = Invoice.objects.get(id=self.data["id"])
        self.assertEqual(saved.revision, 1)
        self.assertEqual(saved.payload["notes"], "")

    def test_private_endpoints_reject_anonymous_and_viewers(self):
        for user in (None, AdminUser(email="viewer@example.com", role="viewer", active=True)):
            self.client.force_authenticate(user=user)
            self.assertIn(self.client.get("/api/admin/invoices").status_code, (401,403))
            self.assertIn(self.save().status_code, (401,403))
            self.assertIn(self.client.get(f'/api/admin/invoices/{self.data["id"]}/pdf').status_code, (401,403))

    def test_pdf_renderer_with_unicode_and_long_table(self):
        data = {**self.data, "client":"রহমান", "notes":"<script>alert('escaped')</script>"}
        data["items"] = data["items"] * 35
        pdf = render_invoice_pdf(data)
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertGreater(len(pdf), 10000)

    def test_half_cent_rounding_matches_frontend_contract(self):
        data = {**self.data, "items": [{"description": "Fraction", "quantity": 0.03, "rate": 72.50}], "discount": 0, "tax": 0, "paid": 0}
        self.assertEqual(invoice_totals(data)["total"], Decimal("2.18"))

    @patch("apps.core.invoice_views.cloudinary.uploader.upload", side_effect=TimeoutError("lost response"))
    @patch("apps.core.invoice_views.render_invoice_pdf", return_value=b"%PDF-test")
    def test_timeout_preserves_durable_cleanup_id(self, render, upload):
        from apps.core.models import BackgroundJob
        from django.utils import timezone
        self.assertEqual(self.save().status_code, 502)
        job = BackgroundJob.objects.get(kind="invoice_upload_cleanup")
        self.assertEqual(job.payload["public_id"], upload.call_args.kwargs["public_id"])
        self.assertGreater(job.available_at, timezone.now())
        self.assertEqual(Invoice.objects.count(), 0)

    @patch("apps.core.services.invoice_cleanup.cloudinary.uploader.destroy", return_value={"result": "ok"})
    @patch("apps.core.invoice_views.cloudinary.uploader.upload")
    @patch("apps.core.invoice_views.render_invoice_pdf", return_value=b"%PDF-test")
    def test_reconciliation_preserves_archives_and_removes_only_orphans(self, render, upload, destroy):
        from apps.core.models import BackgroundJob
        from apps.core.management.commands.run_jobs import Command
        from django.utils import timezone
        from datetime import timedelta
        self.assertEqual(self.save().status_code, 200)
        job = BackgroundJob.objects.get(kind="invoice_upload_cleanup")
        self.assertEqual(InvoiceRevision.objects.get().cloudinary_public_id, job.payload["public_id"])
        command = Command()
        command.process_background_jobs()
        job.refresh_from_db()
        self.assertEqual(job.status, "pending")
        BackgroundJob.objects.filter(pk=job.pk).update(available_at=timezone.now() - timedelta(seconds=1))
        command.process_background_jobs()
        destroy.assert_not_called()
        job.refresh_from_db()
        self.assertEqual(job.status, "completed")
        orphan = BackgroundJob.objects.create(kind="invoice_upload_cleanup", payload={"public_id": "banglasketch/invoices/unused/test.pdf"})
        command.process_background_jobs()
        destroy.assert_called_once_with(orphan.payload["public_id"], resource_type="raw", type="authenticated", timeout=10)
        orphan.refresh_from_db()
        self.assertEqual(orphan.status, "completed")

    @patch("apps.core.services.invoice_cleanup.cloudinary.uploader.destroy", side_effect=TimeoutError())
    def test_cleanup_failure_is_delayed_and_retried(self, destroy):
        from apps.core.models import BackgroundJob
        from apps.core.management.commands.run_jobs import Command
        from django.utils import timezone
        job = BackgroundJob.objects.create(kind="invoice_upload_cleanup", payload={"public_id": "banglasketch/invoices/unused/test.pdf"})
        command = Command()
        command.process_background_jobs()
        job.refresh_from_db()
        self.assertEqual(job.status, "failed")
        self.assertEqual(job.attempts, 1)
        self.assertGreater(job.available_at, timezone.now())
        command.process_background_jobs()
        self.assertEqual(destroy.call_count, 1)
