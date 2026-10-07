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
from django.core.mail import EmailMultiAlternatives
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import escape
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.authentication.auth import IsAdminUserAuthenticated, require_role
from .invoice_serializers import InvoiceSerializer
from .models import Invoice, InvoiceRevision, BackgroundJob, AuditLog
from .services.invoice_pdf import render_invoice_pdf, invoice_totals

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
            {
                "id": str(row.id),
                "number": row.number,
                "client": row.payload.get("client", ""),
                "project": row.payload.get("project", ""),
                "issued": row.payload.get("issued", ""),
                "due": row.payload.get("due", ""),
                "clientPhone": row.payload.get("clientPhone", ""),
                "clientEmail": row.payload.get("clientEmail", ""),
                "revision": row.revision,
                "updatedAt": row.updated_at.isoformat(),
                "cloudSaved": True,
            }
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


def get_invoice_pdf_content(invoice):
    """Retrieve the archived PDF from Cloudinary or fall back to on-the-fly rendering."""
    revision = invoice.revisions.filter(revision=invoice.revision).first()
    if revision and revision.cloudinary_public_id:
        try:
            configure_storage()
            url = cloudinary.utils.private_download_url(
                revision.cloudinary_public_id, None,
                resource_type="raw", type="authenticated",
                expires_at=int(time.time()) + 120, attachment=False
            )
            response = requests.get(url, timeout=25)
            response.raise_for_status()
            if response.content.startswith(b"%PDF"):
                return response.content
        except Exception as exc:
            logger.warning("Cloudinary PDF retrieval failed, falling back to local render (%s)", type(exc).__name__)
    return render_invoice_pdf(invoice.payload)


def build_invoice_email(invoice, custom_notes=None):
    """Build branded subject, plain text, and HTML body for invoice delivery."""
    payload = invoice.payload
    client_name = payload.get("client") or "Valued Client"
    project_name = payload.get("project") or "Architecture & Interior Design"
    company_name = payload.get("company") or "Bangla Sketch"
    company_address = payload.get("address") or "Dhaka, Bangladesh"
    company_phone = payload.get("phone") or "+880 1712-458794"
    company_email = payload.get("email") or "info@banglasketch.com"
    payment_methods = payload.get("payment") or ""
    payment_terms = payload.get("terms") or ""

    totals = invoice_totals(payload)
    formatted_due = f"{totals['due']:,.2f}"
    formatted_total = f"{totals['total']:,.2f}"
    formatted_subtotal = f"{totals['subtotal']:,.2f}"
    formatted_discount = f"{totals['discount']:,.2f}"
    formatted_tax = f"{totals['tax']:,.2f}"
    formatted_paid = f"{totals['paid']:,.2f}"

    subject = f"Invoice #{invoice.number} from {company_name} — {project_name}"

    items_text = "\n".join(
        f"- {item.get('description', 'Service')}: Qty {item.get('quantity', 1)} @ BDT {float(item.get('rate', 0)):,.2f}"
        for item in payload.get("items", [])
    )

    text_content = (
        f"Dear {client_name},\n\n"
        f"Your invoice #{invoice.number} from {company_name} for '{project_name}' is ready.\n\n"
        f"Summary of Charges:\n"
        f"-------------------\n"
        f"Invoice Number: {invoice.number}\n"
        f"Issue Date: {payload.get('issued', '—')}\n"
        f"Payment Due Date: {payload.get('due', '—')}\n\n"
        f"Services:\n{items_text}\n\n"
        f"Subtotal: BDT {formatted_subtotal}\n"
        + (f"Discount ({payload.get('discount', 0)}%): -BDT {formatted_discount}\n" if totals['discount'] > 0 else "")
        + (f"Tax ({payload.get('tax', 0)}%): +BDT {formatted_tax}\n" if totals['tax'] > 0 else "")
        + f"Total Amount: BDT {formatted_total}\n"
        + (f"Amount Paid: BDT {formatted_paid}\n" if totals['paid'] > 0 else "")
        + f"Total Due: BDT {formatted_due}\n\n"
        + (f"Payment Instructions:\n{payment_methods}\n\n" if payment_methods else "")
        + (f"Payment Terms:\n{payment_terms}\n\n" if payment_terms else "")
        + (f"Special Note:\n{custom_notes}\n\n" if custom_notes else "")
        + f"Please find the official invoice PDF attached to this email.\n\n"
        f"Warm regards,\n"
        f"{company_name}\n"
        f"Architecture • Interior • Landscape\n"
        f"{company_address}\n"
        f"Phone: {company_phone} | Email: {company_email}\n"
    )

    items_html_rows = "".join(
        f"""<tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #ede8de; font-size: 14px; color: #242824;">{escape(item.get('description', '—'))}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #ede8de; font-size: 14px; text-align: center; color: #586348;">{escape(str(item.get('quantity', 1)))}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #ede8de; font-size: 14px; text-align: right; color: #242824;">BDT {float(item.get('rate', 0)):,.2f}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #ede8de; font-size: 14px; text-align: right; font-weight: 600; color: #242824;">BDT {float(item.get('quantity', 1)) * float(item.get('rate', 0)):,.2f}</td>
        </tr>"""
        for item in payload.get("items", [])
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #242824; }}
    .card {{ background: #ffffff; border-radius: 12px; padding: 36px; max-width: 620px; margin: 0 auto; border: 1px solid #e2ded7; }}
    .brand-header {{ border-bottom: 2px solid #586348; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }}
    .brand-title {{ font-size: 24px; font-weight: 800; color: #242824; margin: 0; letter-spacing: 0.5px; text-transform: uppercase; }}
    .brand-subtitle {{ font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #586348; margin-top: 4px; }}
    .badge {{ display: inline-block; padding: 4px 10px; border-radius: 4px; background: #fcfaef; border: 1px solid #d4cca9; font-size: 12px; font-weight: 700; color: #586348; }}
    .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; background: #faf9f6; padding: 16px; border-radius: 8px; border: 1px solid #eae5db; }}
    .info-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #737c64; font-weight: 600; margin-bottom: 2px; }}
    .info-val {{ font-size: 14px; font-weight: 600; color: #242824; }}
    .table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    .table th {{ background: #f4f2eb; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #586348; text-align: left; border-bottom: 2px solid #ded8cb; }}
    .totals-box {{ background: #fbf9f4; border: 1px solid #eae5db; border-radius: 8px; padding: 16px; margin: 20px 0; }}
    .total-row {{ display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #3d443d; }}
    .grand-total {{ border-top: 2px solid #586348; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 800; color: #242824; }}
    .section-title {{ font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #586348; margin: 16px 0 6px; }}
    .section-text {{ font-size: 13px; color: #4a524a; line-height: 1.5; white-space: pre-wrap; margin: 0; }}
    .attachment-notice {{ background: #eef3eb; border: 1px solid #bcd3ba; border-radius: 6px; padding: 12px 16px; margin: 24px 0 16px; font-size: 13px; color: #2f4e2b; display: flex; align-items: center; gap: 8px; }}
    .footer {{ margin-top: 32px; border-top: 1px solid #eae5db; padding-top: 20px; font-size: 12px; color: #8c948c; text-align: center; line-height: 1.6; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand-header">
      <div>
        <h1 class="brand-title">{escape(company_name)}</h1>
        <div class="brand-subtitle">Architecture & Interior Design</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">INVOICE</span>
        <div style="font-size: 14px; font-weight: 700; color: #242824; margin-top: 6px;">#{escape(invoice.number)}</div>
      </div>
    </div>

    <p style="font-size: 15px; color: #242824; line-height: 1.6;">
      Dear <strong>{escape(client_name)}</strong>,<br>
      Please find the invoice for your project <strong>{escape(project_name)}</strong> below. An official PDF copy has been attached to this email.
    </p>

    <div class="info-grid">
      <div>
        <div class="info-label">Date Issued</div>
        <div class="info-val">{escape(payload.get('issued', '—'))}</div>
      </div>
      <div>
        <div class="info-label">Payment Due</div>
        <div class="info-val">{escape(payload.get('due', '—'))}</div>
      </div>
      <div>
        <div class="info-label">Project</div>
        <div class="info-val">{escape(project_name)}</div>
      </div>
      <div>
        <div class="info-label">Currency</div>
        <div class="info-val">BDT (Bangladeshi Taka)</div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Service</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate (BDT)</th>
          <th style="text-align: right;">Amount (BDT)</th>
        </tr>
      </thead>
      <tbody>
        {items_html_rows}
      </tbody>
    </table>

    <div class="totals-box">
      <div class="total-row"><span>Subtotal:</span><span>BDT {formatted_subtotal}</span></div>
      {f'<div class="total-row" style="color: #6b4028;"><span>Discount ({payload.get("discount", 0)}%):</span><span>-BDT {formatted_discount}</span></div>' if totals['discount'] > 0 else ''}
      {f'<div class="total-row" style="color: #6b4028;"><span>Tax ({payload.get("tax", 0)}%):</span><span>+BDT {formatted_tax}</span></div>' if totals['tax'] > 0 else ''}
      <div class="total-row" style="font-weight: 600;"><span>Invoice Total:</span><span>BDT {formatted_total}</span></div>
      {f'<div class="total-row" style="color: #2b5e28;"><span>Amount Paid:</span><span>BDT {formatted_paid}</span></div>' if totals['paid'] > 0 else ''}
      <div class="total-row grand-total"><span>Total Due:</span><span>BDT {formatted_due}</span></div>
    </div>

    {f'<div style="margin: 16px 0;"><div class="section-title">Payment Instructions</div><p class="section-text">{escape(payment_methods)}</p></div>' if payment_methods else ''}
    {f'<div style="margin: 16px 0;"><div class="section-title">Payment Terms</div><p class="section-text">{escape(payment_terms)}</p></div>' if payment_terms else ''}
    {f'<div style="background: #fcfaef; border-left: 3px solid #586348; padding: 12px 14px; margin: 16px 0; border-radius: 4px;"><div class="info-label">Note from Studio</div><p class="section-text">{escape(custom_notes)}</p></div>' if custom_notes else ''}

    <div class="attachment-notice">
      📄 <strong>Attachment Included:</strong> Official invoice PDF (<em>Invoice-{escape(invoice.number)}.pdf</em>)
    </div>

    <div class="footer">
      <strong>{escape(company_name)} Studio</strong><br>
      {escape(company_address)} • Phone: {escape(company_phone)} • {escape(company_email)}<br>
      <span style="color: #586348;">Thoughtful spaces, made for you.</span>
    </div>
  </div>
</body>
</html>"""
    return subject, text_content, html_content


class PublicInvoicePDFView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, invoice_id):
        invoice = Invoice.objects.filter(pk=invoice_id).first()
        if not invoice:
            return Response({"success": False, "error": "Invoice not found"}, status=404)
        try:
            pdf_bytes = get_invoice_pdf_content(invoice)
            result = HttpResponse(pdf_bytes, content_type="application/pdf")
            result["Content-Disposition"] = f'inline; filename="BanglaSketch-Invoice-{invoice.number}.pdf"'
            result["Cache-Control"] = "private, no-store"
            result["X-Content-Type-Options"] = "nosniff"
            return result
        except Exception:
            logger.exception("Failed to render or retrieve public invoice PDF")
            return Response({"success": False, "error": "The invoice PDF could not be retrieved."}, status=502)


class AdminInvoiceSendEmailView(APIView):
    permission_classes = [IsAdminUserAuthenticated, require_role("admin")]

    def post(self, request, invoice_id):
        invoice = Invoice.objects.filter(pk=invoice_id).first()
        if not invoice:
            return Response({"success": False, "error": "Invoice not found"}, status=404)

        data = request.data or {}
        if not isinstance(data, dict):
            return Response({"success": False, "error": "Expected an object."}, status=400)
        if len(str(data.get("custom_notes") or "")) > 5000:
            return Response({"success": False, "error": "Email notes must be at most 5000 characters."}, status=400)
        recipient = data.get("recipient_email") or invoice.payload.get("clientEmail") or ""
        recipient = str(recipient).strip()
        custom_notes = str(data.get("custom_notes") or "").strip()

        if not recipient:
            return Response({"success": False, "error": "Please provide a valid client email address."}, status=400)

        try:
            validate_email(recipient)
        except ValidationError:
            return Response({"success": False, "error": "Invalid email address format."}, status=400)

        try:
            pdf_bytes = get_invoice_pdf_content(invoice)
            subject, text_body, html_body = build_invoice_email(invoice, custom_notes=custom_notes)
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "info@banglasketch.com")

            msg = EmailMultiAlternatives(subject, text_body, from_email, [recipient])
            msg.attach_alternative(html_body, "text/html")
            msg.attach(f"Invoice-{invoice.number}.pdf", pdf_bytes, "application/pdf")
            msg.send(fail_silently=False)

            AuditLog.objects.create(
                actor=request.user,
                action="invoice_email_sent",
                entity_type="invoice",
                entity_id=str(invoice.id),
                after_data={"recipient": recipient, "number": invoice.number},
                ip_address=request.META.get("REMOTE_ADDR", ""),
                request_id=getattr(request, "request_id", ""),
            )

            return Response({
                "success": True,
                "message": f"Invoice #{invoice.number} successfully emailed to {recipient}.",
            })
        except Exception:
            logger.exception("Failed to send invoice email for invoice %s", invoice_id)
            return Response({
                "success": False,
                "error": "Failed to deliver email. Please check email settings and try again.",
            }, status=502)
