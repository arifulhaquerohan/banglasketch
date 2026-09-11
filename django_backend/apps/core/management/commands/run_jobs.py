import time
import signal
import datetime
import logging
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import F
from django.utils import timezone
from apps.blog.models import BlogPost
from apps.authentication.models import AdminPasswordReset
from apps.leads.models import ContactEmailJob
from apps.core.models import BackgroundJob
from apps.core.services.media_cleanup import delete_media_from_cloudinary

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
        jobs = BackgroundJob.objects.filter(
            status__in=["pending", "failed"],
            attempts__lt=F("max_attempts")
        ).order_by("available_at")[:10]

        for job in jobs:
            job.status = "running"
            job.locked_at = timezone.now()
            job.save(update_fields=["status", "locked_at"])

            try:
                if job.kind == "media_cleanup":
                    public_id = job.payload.get("public_id")
                    if public_id:
                        success = delete_media_from_cloudinary(public_id)
                        if success:
                            job.status = "completed"
                            job.completed_at = timezone.now()
                        else:
                            raise Exception("Failed to delete from Cloudinary")
                    else:
                        raise Exception("Missing public_id in payload")
                else:
                    raise Exception(f"Unknown job kind: {job.kind}")

            except Exception as e:
                job.status = "failed"
                job.last_error = str(e)
                job.attempts = job.attempts + 1
            finally:
                job.locked_at = None
                job.save()
