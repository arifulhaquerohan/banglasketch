import time
import signal
import sys
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.leads.models import ContactEmailJob
from apps.leads.services.email import process_email_job

logger = logging.getLogger("email_worker")

class Command(BaseCommand):
    help = "Background worker that delivers pending contact email notification and confirmation jobs"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.running = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--once",
            action="store_true",
            help="Process pending jobs once and exit immediately",
        )
        parser.add_argument(
            "--interval",
            type=float,
            default=5.0,
            help="Interval in seconds between polling cycles (default: 5.0)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=10,
            help="Maximum number of jobs to fetch per batch (default: 10)",
        )

    def handle_signal(self, signum, frame):
        self.stdout.write(self.style.WARNING(f"\nReceived signal {signum}, stopping worker gracefully..."))
        self.running = False

    def handle(self, *args, **options):
        once = options.get("once", False)
        interval = options.get("interval", 5.0)
        limit = options.get("limit", 10)

        # Register signal handlers for graceful exit
        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)

        self.stdout.write(self.style.SUCCESS("Starting Banglasketch Email Worker..."))

        while self.running:
            processed_count = self.process_batch(limit)

            if once:
                self.stdout.write(self.style.SUCCESS(f"Finished one-off run. Processed {processed_count} jobs."))
                break

            if processed_count == 0:
                # Sleep when there are no jobs
                time.sleep(interval)

    def process_batch(self, limit: int) -> int:
        now = timezone.now()
        processed = 0

        # Fetch candidate job IDs using SKIP LOCKED in transaction
        with transaction.atomic():
            jobs = list(
                ContactEmailJob.objects.select_for_update(skip_locked=True)
                .filter(
                    delivered_at__isnull=True,
                    attempts__lt=8,
                    available_at__lte=now,
                )
                .select_related("submission")[:limit]
            )

            for job in jobs:
                try:
                    success = process_email_job(job)
                    if success:
                        self.stdout.write(self.style.SUCCESS(
                            f"Delivered job #{job.id} ({job.kind}) for submission #{job.submission_id}"
                        ))
                    else:
                        self.stdout.write(self.style.WARNING(
                            f"Retrying job #{job.id} ({job.kind}) on next cycle (attempt #{job.attempts})"
                        ))
                    processed += 1
                except Exception as e:
                    logger.exception(f"Unexpected error processing job #{job.id}: {e}")
                    self.stdout.write(self.style.ERROR(f"Error processing job #{job.id}: {e}"))

        return processed
