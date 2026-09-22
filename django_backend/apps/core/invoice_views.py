from datetime import timedelta
import hashlib
import json
import logging
import time
import uuid
from io import BytesIO

import cloudinary
import cloudinary.uploader
import cloudinary.utils
import requests
from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from .invoice_serializers import InvoiceSerializer
from .models import Invoice, InvoiceRevision, BackgroundJob
from .services.invoice_pdf import render_invoice_pdf

logger = logging.getLogger(__name__)


def configure_storage():
    if not all(getattr(settings, key, "") for key in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")):
        raise RuntimeError("Cloudinary is not configured")
    cloudinary.config(cloud_name=settings.CLOUDINARY_CLOUD_NAME, api_key=settings.CLOUDINARY_API_KEY,
                      api_secret=settings.CLOUDINARY_API_SECRET, secure=True)


def serialize_invoice(invoice):
    return {**invoice.payload, "id": str(invoice.id), "revision": invoice.revision,
            "updatedAt": invoice.updated_at.isoformat(), "cloudSaved": True}


class AdminInvoicesView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request):
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        limit = 50
        records = list(Invoice.objects.all()[(page - 1) * limit:page * limit + 1])
        return Response({"success": True, "data": [
            {"id": str(row.id), "number": row.number, "client": row.payload.get("client", ""),
             "revision": row.revision, "updatedAt": row.updated_at.isoformat(), "cloudSaved": True}
            for row in records[:limit]], "pagination": {"page": page, "limit": limit, "hasMore": len(records) > limit}})

    def post(self, request):
        serializer = InvoiceSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            field = next(iter(errors))
            return Response({"success": False, "error": f"Please check {field}: {errors[field]}", "fields": errors}, status=400)
        # Canonical JSON data only. Client totals, file URLs and cloud IDs are never accepted.
        payload = json.loads(json.dumps(serializer.validated_data, default=str))
        invoice_id = payload.pop("id")
        expected_revision = payload.pop("revision")
        for key in ("discount", "tax", "paid"):
            payload[key] = float(payload[key])
        for item in payload["items"]:
            item["quantity"], item["rate"] = float(item["quantity"]), float(item["rate"])
        fingerprint = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

        # Check for matching existing revision before performing network I/O
        existing_invoice = Invoice.objects.filter(pk=invoice_id).first()
        if existing_invoice:
            if existing_invoice.revision != expected_revision:
                return Response({"success": False, "error": "This invoice was updated elsewhere. Reload the saved invoice before editing."}, status=409)
            latest = existing_invoice.revisions.filter(revision=existing_invoice.revision).first()
            if latest and latest.fingerprint == fingerprint:
                return Response({"success": True, "data": serialize_invoice(existing_invoice)})
        elif expected_revision:
            return Response({"success": False, "error": "Saved invoice not found. Reload the invoice list."}, status=409)

        if Invoice.objects.exclude(pk=invoice_id).filter(number=payload["number"]).exists():
            return Response({"success": False, "error": "That invoice number is already in use."}, status=409)

        cleanup_job = None
        upload_attempted = False
        try:
            configure_storage()
            pdf = render_invoice_pdf(payload)
            public_id = f"banglasketch/invoices/{invoice_id}/{uuid.uuid4().hex}.pdf"
            # Commit the recovery record before executing the external network upload.
            cleanup_job = BackgroundJob.objects.create(kind="invoice_upload_cleanup", payload={"public_id": public_id})
            BackgroundJob.objects.filter(pk=cleanup_job.pk).update(available_at=timezone.now() + timedelta(hours=24))

            # External upload outside DB transaction to prevent row-lock and pool starvation
            upload_attempted = True
            cloudinary.uploader.upload(
                BytesIO(pdf), resource_type="raw", type="authenticated", overwrite=False,
                public_id=public_id, timeout=45,
            )

            with transaction.atomic():
                invoice = Invoice.objects.select_for_update().filter(pk=invoice_id).first()
                if invoice and invoice.revision != expected_revision:
                    return Response({"success": False, "error": "This invoice was updated elsewhere. Reload the saved invoice before editing."}, status=409)
                if not invoice:
                    if expected_revision:
                        return Response({"success": False, "error": "Saved invoice not found. Reload the invoice list."}, status=409)
                    invoice = Invoice.objects.create(id=invoice_id, number=payload["number"])
                if Invoice.objects.exclude(pk=invoice_id).filter(number=payload["number"]).exists():
                    return Response({"success": False, "error": "That invoice number is already in use."}, status=409)

                invoice.number, invoice.payload = payload["number"], payload
                invoice.revision += 1
                invoice.save()
                InvoiceRevision.objects.create(
                    invoice=invoice, revision=invoice.revision, payload=payload,
                    fingerprint=fingerprint, cloudinary_public_id=public_id, actor=request.user
                )

            return Response({"success": True, "data": serialize_invoice(invoice)})
        except Exception as exc:
            if isinstance(exc, IntegrityError):
                return Response({"success": False, "error": "Invoice number already exists or a concurrent save occurred. Reload and retry."}, status=409)
            logger.exception("Invoice PDF archive failed")
            return Response({"success": False, "error": "The invoice could not be archived. Your previous saved version is unchanged. Please retry."}, status=502)
        finally:
            if cleanup_job and not upload_attempted:
                BackgroundJob.objects.filter(pk=cleanup_job.pk).delete()


class AdminInvoiceDetailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request, invoice_id):
        invoice = Invoice.objects.filter(pk=invoice_id).first()
        if not invoice:
            return Response({"success": False, "error": "Invoice not found"}, status=404)
        return Response({"success": True, "data": serialize_invoice(invoice)})


class AdminInvoicePDFView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def get(self, request, invoice_id):
        invoice = Invoice.objects.filter(pk=invoice_id).first()
        if not invoice:
            return Response({"success": False, "error": "Invoice not found"}, status=404)
        revision = invoice.revisions.filter(revision=invoice.revision).first()
        if not revision:
            return Response({"success": False, "error": "No archived PDF is available"}, status=404)
        try:
            configure_storage()
            url = cloudinary.utils.private_download_url(revision.cloudinary_public_id, None,
                resource_type="raw", type="authenticated", expires_at=int(time.time()) + 60, attachment=False)
            response = requests.get(url, timeout=25)
            response.raise_for_status()
            if not response.content.startswith(b"%PDF"):
                raise ValueError("Invalid PDF response")
            result = HttpResponse(response.content, content_type="application/pdf")
            result["Content-Disposition"] = f'inline; filename="invoice-{invoice.id}.pdf"'
            result["Cache-Control"] = "private, no-store"
            result["X-Content-Type-Options"] = "nosniff"
            return result
        except Exception:
            return Response({"success": False, "error": "The archived PDF could not be retrieved. Please retry."}, status=502)
