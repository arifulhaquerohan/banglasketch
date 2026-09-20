import datetime

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_time


def is_site_visit_time_bookable(visit_date, time_slot, *, now=None):
    """Check the minimum booking lead time using the configured local timezone."""
    local_now = timezone.localtime(now or timezone.now())
    if visit_date > local_now.date():
        return True
    if visit_date < local_now.date():
        return False

    slot_time = parse_time(time_slot)
    if slot_time is None:
        return False

    slot_at = timezone.make_aware(
        datetime.datetime.combine(visit_date, slot_time),
        timezone.get_current_timezone(),
    )
    lead_minutes = max(0, int(getattr(settings, "SITE_VISIT_MIN_LEAD_MINUTES", 120)))
    return slot_at >= local_now + datetime.timedelta(minutes=lead_minutes)
