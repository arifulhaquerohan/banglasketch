"""Public business context and deterministic portfolio recommendations.

The service catalog is shared with the website. Only published portfolio fields
are supplied to the provider; client names and other private records stay out.
"""
import json
import re
from pathlib import Path
from urllib.parse import quote, urlsplit

from django.db.models import Q, Case, When, IntegerField, Value
from django.utils.html import strip_tags
from apps.projects.models import Project

CATALOG_PATH = Path(__file__).resolve().parents[4] / "shared" / "services.json"
ROOMS = {
    "kitchen": ("kitchen", "রান্নাঘর", "রান্না ঘর", "কিচেন", "rannaghor"),
    "bedroom": ("bedroom", "bed room", "শোবার", "বেডরুম"),
    "living-room": ("living room", "living space", "drawing room", "লিভিং", "বসার", "ড্রয়িং"),
    "bathroom": ("bathroom", "bath room", "washroom", "বাথরুম", "বাথরুমের", "গোসল"),
}
STYLES = {
    "modern": ("modern", "মডার্ন", "আধুনিক"),
    "minimal": ("minimal", "minimalist", "মিনিমাল"),
    "luxury": ("luxury", "luxurious", "লাক্সারি", "বিলাসবহুল"),
    "classic": ("classic", "classical", "ক্লাসিক"),
}
BROWSE = ("project", "portfolio", "inspiration", "example", "apartment", "flat", "প্রজেক্ট", "পোর্টফোলিও", "ফ্ল্যাট", "উদাহরণ")


def contains(text, word):
    # English word boundaries avoid matching 'flat' in unrelated words.
    if word.isascii():
        return bool(re.search(r"(?<!\w)" + re.escape(word) + r"s?(?!\w)", text))
    return word in text


def preferences(messages):
    category = style = None
    browse = False
    for message in messages:
        if message["role"] != "user":
            continue
        text = message["content"].lower()
        for key, words in ROOMS.items():
            if any(contains(text, word) for word in words):
                category = key
        for key, words in STYLES.items():
            if any(contains(text, word) for word in words):
                style = key
        browse = browse or any(contains(text, word) for word in BROWSE)
    return category, style, browse


def safe_image(value):
    value = value or ""
    if value.startswith("/") and not value.startswith("//") and "\\" not in value:
        return value
    try:
        parsed = urlsplit(value)
        return value if parsed.scheme == "https" and parsed.netloc and not parsed.username else ""
    except ValueError:
        return ""


def build_knowledge(messages):
    services = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    category, style, browse = preferences(messages)
    projects = []
    if category or style or browse:
        qs = Project.objects.filter(published=True, deleted_at__isnull=True).exclude(slug="")
        if category:
            qs = qs.filter(category=category)
        if style:
            matches = Q(title__icontains=style) | Q(description__icontains=style)
            qs = qs.annotate(style_match=Case(When(matches, then=Value(1)), default=Value(0), output_field=IntegerField())).order_by("-style_match", "-featured", "-created_at", "-id")
        else:
            qs = qs.order_by("-featured", "-created_at", "-id")
        for project in qs.only("title", "slug", "description", "category", "featured_image")[:3]:
            projects.append({
                "title": project.title,
                "url": "/portfolio/" + quote(project.slug, safe=""),
                "category": project.category,
                "description": strip_tags(project.description or "")[:500],
                "image": safe_image(project.featured_image),
            })
    context = {
        "contact": {key: value for key, value in json.loads((CATALOG_PATH.parent / "contact.json").read_text(encoding="utf-8")).items() if key in ("phone", "whatsapp", "email", "address")},
        "services": [{"name": s["name"], "description": s["fullDescription"], "url": "/services/" + s["id"]} for s in services],
        "projects": [{k: v for k, v in p.items() if k != "image"} for p in projects],
        "matching": {"room": category, "style_preference": style, "note": "Ranked by room and description keywords; style matches are not guaranteed. No results means no published match, not that the service is unavailable."},
    }
    return context, projects
