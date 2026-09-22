import time
import signal
import datetime
import logging
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.db.models import F
from django.utils import timezone
from apps.blog.models import BlogPost
from apps.authentication.models import AdminPasswordReset
from apps.leads.models import ContactEmailJob
from apps.core.models import BackgroundJob
from apps.core.services.media_cleanup import delete_media_from_cloudinary
from apps.core.services.invoice_cleanup import reconcile_invoice_upload

logger = logging.getLogger("scheduled_jobs")

class Command(BaseCommand):
    help = "Runs periodic tasks: publishes scheduled blog posts and purges expired operational data."

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.running = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--once",
            action="store_true",
            help="Execute all scheduled jobs once and exit",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=60,
            help="Polling interval in seconds (default: 60)",
        )

    def handle_signal(self, signum, frame):
        self.stdout.write(self.style.WARNING(f"\nReceived signal {signum}, stopping scheduler..."))
        self.running = False

    def handle(self, *args, **options):
        once = options.get("once", False)
        interval = options.get("interval", 60)

        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)

        self.stdout.write(self.style.SUCCESS("Starting Banglasketch Scheduled Job Runner..."))

        while self.running:
            self.publish_scheduled_posts()
            self.purge_operational_data()
            self.process_background_jobs()

            if once:
                self.stdout.write(self.style.SUCCESS("Executed scheduled tasks in one-off mode."))
                break

            time.sleep(interval)

    def publish_scheduled_posts(self):
        now = timezone.now()
        due_posts = BlogPost.objects.filter(
            published=False,
            deleted_at__isnull=True,
            scheduled_publish_date__isnull=False,
            scheduled_publish_date__lte=now,
        )

        count = 0
        for post in due_posts:
            post.published = True
            post.published_date = now
            post.scheduled_publish_date = None
            post.save(update_fields=["published", "published_date", "scheduled_publish_date", "updated_at"])
            count += 1
            self.stdout.write(self.style.SUCCESS(f"Published scheduled blog post: '{post.title}' (slug: {post.slug})"))

        if count > 0:
            self.stdout.write(self.style.SUCCESS(f"Successfully published {count} scheduled blog post(s)."))

    def purge_operational_data(self):
        now = timezone.now()

        # 1. Purge expired rate limit records
        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM rate_limit_counters WHERE expires_at < %s;", [now])
        except Exception as e:
            # Table might not exist yet or running in testing environment
            logger.debug(f"Rate limit purge skipped: {e}")

        # 2. Purge old password reset entries (older than 7 days)
        cutoff_resets = now - datetime.timedelta(days=7)
        deleted_resets, _ = AdminPasswordReset.objects.filter(
            expires_at__lt=cutoff_resets
        ).delete()

        # 3. Purge completed email jobs older than 30 days
        cutoff_jobs = now - datetime.timedelta(days=30)
        deleted_jobs, _ = ContactEmailJob.objects.filter(
            delivered_at__isnull=False,
            delivered_at__lt=cutoff_jobs,
        ).delete()

        if deleted_resets > 0 or deleted_jobs > 0:
            self.stdout.write(
                f"Purged {deleted_resets} expired password reset tokens and {deleted_jobs} old email jobs."
            )

    def process_background_jobs(self):
        now = timezone.now()
        # A terminated worker must not strand cleanup jobs forever.
        BackgroundJob.objects.filter(status="running", locked_at__lt=now - datetime.timedelta(minutes=10)).update(
            status="failed", locked_at=None, available_at=now)
        for _ in range(10):
            with transaction.atomic():
                jobs = BackgroundJob.objects.filter(
                    status__in=["pending", "failed"], available_at__lte=timezone.now(),
                    attempts__lt=F("max_attempts"),
                ).order_by("available_at", "id")
                if connection.features.has_select_for_update_skip_locked:
                    jobs = jobs.select_for_update(skip_locked=True)
                else:
                    jobs = jobs.select_for_update()
                job = jobs.first()
                if not job:
                    break
                # Conditional claim also protects backends without row locks.
                claimed = BackgroundJob.objects.filter(pk=job.pk, status=job.status).update(
                    status="running", locked_at=timezone.now(), attempts=F("attempts") + 1)
                if not claimed:
                    continue
                job.attempts += 1
            try:
                public_id = job.payload.get("public_id")
                if job.kind == "invoice_upload_cleanup":
                    reconcile_invoice_upload(public_id)
                elif job.kind == "media_cleanup":
                    if not public_id or not delete_media_from_cloudinary(public_id):
                        raise RuntimeError("Failed to delete media from Cloudinary")
                else:
                    raise ValueError("Unknown background job kind")
                job.status = "completed"
                job.completed_at = timezone.now()
                job.last_error = None
            except Exception:
                job.status = "failed"
                job.last_error = "Background cleanup failed; will retry."
                job.available_at = timezone.now() + datetime.timedelta(seconds=min(3600, 60 * 2 ** job.attempts))
                logger.exception("Background cleanup job failed: %s", job.pk)
            finally:
                job.locked_at = None
                job.save(update_fields=["status", "completed_at", "last_error", "available_at", "locked_at"])
