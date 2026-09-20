"""Remove stale rate-limit counters, password-reset requests, and old login history."""

from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = "Delete expired rate-limit entries, old password resets, and login history older than 90 days."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=90,
            help="Delete login history and password resets older than N days (default 90).",
        )

    def handle(self, *args, **options):
        days = options["days"]
        now = timezone.now()
        cutoff = now - timedelta(days=days)

        # 1. Expired rate-limit counters
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM rate_limit_counters WHERE expires_at < %s", [now])
                rl_deleted = cursor.rowcount
        else:
            from apps.core.models import RateLimitCounter
            rl_deleted, _ = RateLimitCounter.objects.filter(expires_at__lt=now).delete()
        self.stdout.write(f"  Rate-limit counters removed: {rl_deleted}")

        # 2. Old password-reset requests
        from apps.authentication.models import AdminPasswordReset
        pr_deleted, _ = AdminPasswordReset.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(f"  Password resets removed:     {pr_deleted}")

        # 3. Old login history
        from apps.authentication.models import LoginHistory
        lh_deleted, _ = LoginHistory.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(f"  Login history removed:       {lh_deleted}")

        self.stdout.write(self.style.SUCCESS(f"Cleanup complete (cutoff: {days} days)."))
