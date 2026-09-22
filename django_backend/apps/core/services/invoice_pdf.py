"""Self-contained A4 invoices: no user-controlled network or filesystem fetches."""
import base64
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from django.conf import settings
from django.template.loader import render_to_string


def invoice_totals(data):
    def rounded(value):
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    lines = [rounded(Decimal(str(i["quantity"])) * Decimal(str(i["rate"]))) for i in data["items"]]
    subtotal = sum(lines, Decimal("0"))
    discount = rounded(subtotal * Decimal(str(data["discount"])) / 100)
    tax = rounded((subtotal - discount) * Decimal(str(data["tax"])) / 100)
    total = subtotal - discount + tax
    paid = Decimal(str(data["paid"]))
    return {"lines": lines, "subtotal": subtotal, "discount": discount, "tax": tax,
            "total": total, "paid": paid, "due": max(Decimal("0"), total - paid), "credit": max(Decimal("0"), paid - total)}


def render_invoice_pdf(data):
    from weasyprint import HTML, default_url_fetcher
    from weasyprint.text.fonts import FontConfiguration
    backend_assets = Path(__file__).resolve().parent.parent / "assets"
    frontend = Path(settings.BASE_DIR).parent / "frontend"
    fonts = backend_assets if (backend_assets / "manrope.ttf").exists() else (frontend / "app" / "fonts")
    logo_path = backend_assets / "brand-logo.png" if (backend_assets / "brand-logo.png").exists() else (frontend / "public/brand-logo.png")
    allowed_fonts = {str((fonts / name).resolve().as_uri()) for name in ("manrope.ttf", "noto-sans-bengali.ttf")}

    def fetch_asset(url):
        if url in allowed_fonts or url.startswith("data:image/png;base64,"):
            return default_url_fetcher(url)
        raise ValueError("Invoice resource not permitted")

    totals = invoice_totals(data)
    rows = [{**item, "formatted_rate": f"{Decimal(str(item['rate'])):,.2f}", "total": f"{total:,.2f}"} for item, total in zip(data["items"], totals["lines"])]
    logo_b64 = "data:image/png;base64," + base64.b64encode(logo_path.read_bytes()).decode() if logo_path.exists() else ""
    context = {"v": data, "rows": rows, "totals": {k: f"{v:,.2f}" for k, v in totals.items() if k != "lines"},
               "has_credit": totals["credit"] > 0,
               "logo": logo_b64,
               "manrope": (fonts / "manrope.ttf").as_uri(), "bengali": (fonts / "noto-sans-bengali.ttf").as_uri()}
    html = render_to_string("core/invoice.html", context)
    return HTML(string=html, url_fetcher=fetch_asset).write_pdf(font_config=FontConfiguration())
