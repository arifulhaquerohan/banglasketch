from django.db import connection
from django.utils import timezone
from datetime import timedelta

class PostgresRateLimiter:
    """
    Atomic PostgreSQL rate limiter matching Express sharedRateLimit.
    Uses the 'rate_limit_counters' table to share limits across processes.
    """
    def __init__(self, prefix: str, window_ms: int, max_hits: int):
        self.prefix = prefix
        self.window_ms = window_ms
        self.max_hits = max_hits

    def check_and_increment(self, key: str) -> tuple[bool, int, timezone.datetime]:
        """
        Increments the hit counter and checks if it exceeds max_hits.
        Returns: (is_allowed, current_hits, reset_time)
        """
        full_key = f"{self.prefix}:{key}"
        window_delta = timedelta(milliseconds=self.window_ms)
        now = timezone.now()
        expiry = now + window_delta

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO rate_limit_counters (key, hits, expires_at)
                VALUES (%s, 1, %s)
                ON CONFLICT (key) DO UPDATE SET
                hits = CASE WHEN rate_limit_counters.expires_at <= %s THEN 1 ELSE rate_limit_counters.hits + 1 END,
                expires_at = CASE WHEN rate_limit_counters.expires_at <= %s THEN EXCLUDED.expires_at ELSE rate_limit_counters.expires_at END
                RETURNING hits, expires_at;
                """,
                [full_key, expiry, now, now],
            )
            row = cursor.fetchone()
            if not row:
                return False, 0, now

            hits, reset_time = row
            return (hits <= self.max_hits), hits, reset_time

    def reset(self, key: str):
        """Manually resets the counter for a key."""
        full_key = f"{self.prefix}:{key}"
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM rate_limit_counters WHERE key = %s", [full_key])
