"""Reconcile delayed upload attempts without deleting archived invoice revisions."""
import cloudinary
import cloudinary.uploader
from django.conf import settings
from apps.core.models import InvoiceRevision


def reconcile_invoice_upload(public_id):
    if not isinstance(public_id, str) or not public_id.startswith("banglasketch/invoices/") or not public_id.endswith(".pdf"):
        raise ValueError("Invalid invoice upload ID")
    if InvoiceRevision.objects.filter(cloudinary_public_id=public_id).exists():
        return
    cloudinary.config(cloud_name=settings.CLOUDINARY_CLOUD_NAME, api_key=settings.CLOUDINARY_API_KEY,
                      api_secret=settings.CLOUDINARY_API_SECRET, secure=True)
    result = cloudinary.uploader.destroy(public_id, resource_type="raw", type="authenticated", timeout=10)
    if result.get("result") not in ("ok", "not found"):
        raise RuntimeError("Invoice cleanup was not acknowledged by storage")
