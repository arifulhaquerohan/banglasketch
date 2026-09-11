import logging
import datetime
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.html import escape
from apps.leads.models import ContactEmailJob, ContactSubmission

logger = logging.getLogger(__name__)

def build_notification_email(submission: ContactSubmission) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML body for studio admin notification."""
    subject = f"[Banglasketch Inquiry] {submission.name} - {submission.service_type or 'General Inquiry'}"

    text_content = (
        f"New Contact Form Submission\n"
        f"============================\n"
        f"Name: {submission.name}\n"
        f"Email: {submission.email}\n"
        f"Phone: {submission.phone or 'Not provided'}\n"
        f"Service: {submission.service_type or 'General'}\n"
        f"Submitted At: {submission.submitted_at}\n\n"
        f"Message:\n"
        f"{submission.message}\n"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #242824; }}
        .card {{ background: #ffffff; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e2ded7; }}
        .header {{ border-bottom: 2px solid #586348; padding-bottom: 16px; margin-bottom: 24px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #242824; margin: 0; }}
        .field {{ margin-bottom: 12px; }}
        .label {{ font-size: 12px; font-weight: 600; text-transform: uppercase; color: #586348; letter-spacing: 0.5px; }}
        .value {{ font-size: 15px; color: #242824; margin-top: 2px; }}
        .message-box {{ background: #fcfaef; border-left: 4px solid #586348; padding: 16px; margin-top: 16px; border-radius: 4px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }}
        .footer {{ margin-top: 32px; font-size: 12px; color: #8c948c; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">Banglasketch Studio — New Inquiry</h1>
        </div>
        <div class="field">
          <div class="label">Client Name</div>
          <div class="value">{escape(submission.name)}</div>
        </div>
        <div class="field">
          <div class="label">Email Address</div>
          <div class="value"><a href="mailto:{escape(submission.email)}">{escape(submission.email)}</a></div>
        </div>
        <div class="field">
          <div class="label">Phone Number</div>
          <div class="value">{escape(submission.phone or 'Not provided')}</div>
        </div>
        <div class="field">
          <div class="label">Space / Service</div>
          <div class="value">{escape(submission.service_type or 'General Inquiry')}</div>
        </div>
        <div class="field">
          <div class="label">Message</div>
          <div class="message-box">{escape(submission.message)}</div>
        </div>
        <div class="footer">
          Received via Banglasketch Web Portal on {timezone.localtime(submission.submitted_at).strftime('%B %d, %Y at %I:%M %p')}
        </div>
      </div>
    </body>
    </html>
    """
    return subject, text_content, html_content


def build_confirmation_email(submission: ContactSubmission) -> tuple[str, str, str]:
    """Build subject, plain text, and HTML body for client confirmation."""
    subject = "Thank you for contacting Banglasketch Studio"

    text_content = (
        f"Dear {submission.name},\n\n"
        f"Thank you for reaching out to Banglasketch Studio. We have received your message regarding {submission.service_type or 'our architectural services'}.\n\n"
        f"Our team is reviewing your inquiry and will respond within 1-2 business days.\n\n"
        f"Warm regards,\n"
        f"Banglasketch Studio\n"
        f"Architecture • Interior • Landscape\n"
        f"Dhaka, Bangladesh\n"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #242824; }}
        .card {{ background: #ffffff; border-radius: 12px; padding: 36px; max-width: 600px; margin: 0 auto; border: 1px solid #e2ded7; }}
        .brand {{ font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #242824; text-transform: uppercase; margin-bottom: 8px; }}
        .subtitle {{ font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #586348; margin-bottom: 24px; }}
        .content {{ font-size: 15px; line-height: 1.7; color: #3d443d; margin-bottom: 24px; }}
        .summary {{ background: #fbf9f4; border: 1px solid #ede8de; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; }}
        .footer {{ border-top: 1px solid #eae5db; padding-top: 20px; font-size: 12px; color: #8c948c; line-height: 1.5; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">Banglasketch</div>
        <div class="subtitle">Architectural Design Studio</div>
        <div class="content">
          <p>Dear {escape(submission.name)},</p>
          <p>Thank you for reaching out to us. We have received your inquiry and our team is currently reviewing your project details.</p>
          <p>We strive to bring thoughtful architectural and interior craftsmanship to every space, and we look forward to exploring how we can collaborate on your vision.</p>
          <div class="summary">
            <strong>Requested Service:</strong> {escape(submission.service_type or 'General Inquiry')}<br>
            <strong>Reference ID:</strong> #{submission.id}
          </div>
          <p>A member of our team will be in touch with you shortly.</p>
        </div>
        <div class="footer">
          <strong>Banglasketch Studio</strong><br>
          Dhaka, Bangladesh • info@banglasketch.com<br>
          <a href="https://banglasketch.com" style="color: #586348; text-decoration: none;">banglasketch.com</a>
        </div>
      </div>
    </body>
    </html>
    """
    return subject, text_content, html_content


def process_email_job(job: ContactEmailJob) -> bool:
    """
    Processes a single ContactEmailJob.
    Returns True if sent successfully, False otherwise.
    """
    submission = job.submission
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "info@banglasketch.com")

    try:
        if job.kind == "notification":
            admin_email = getattr(settings, "ADMIN_RECOVERY_EMAIL", "arifulhaquerohan@gmail.com")
            subject, text, html = build_notification_email(submission)
            msg = EmailMultiAlternatives(subject, text, from_email, [admin_email])
            msg.attach_alternative(html, "text/html")
            msg.send(fail_silently=False)
        elif job.kind == "confirmation":
            if not submission.email or "@" not in submission.email:
                # Can't deliver confirmation if no valid email
                job.delivered_at = timezone.now()
                job.save(update_fields=["delivered_at"])
                return True
            subject, text, html = build_confirmation_email(submission)
            msg = EmailMultiAlternatives(subject, text, from_email, [submission.email])
            msg.attach_alternative(html, "text/html")
            msg.send(fail_silently=False)
        else:
            logger.warning(f"Unknown email job kind: {job.kind}")
            return False

        job.delivered_at = timezone.now()
        job.attempts += 1
        job.save(update_fields=["delivered_at", "attempts"])
        return True

    except Exception as e:
        logger.error(f"Failed to deliver email job #{job.id} ({job.kind}): {e}")
        job.attempts += 1
        # Exponential backoff: 10s * 2^(attempts-1), max 1 hour
        backoff_seconds = min(3600, 10 * (2 ** max(0, job.attempts - 1)))
        job.available_at = timezone.now() + datetime.timedelta(seconds=backoff_seconds)
        job.save(update_fields=["attempts", "available_at"])
        return False
