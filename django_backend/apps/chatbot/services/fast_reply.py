"""High-performance instant intent classifier and deterministic response engine.

Provides zero-latency (~5ms) responses for common visitor queries (greetings,
contact details, office address, service offerings, work process, pricing guide)
without invoking external LLM APIs. Supports English, Bengali, and Banglish.
"""
import re
from typing import Optional, Tuple

CONTACT_PHONE = "01712-458794"
CONTACT_WHATSAPP = "+8801712458794"
CONTACT_EMAIL = "info@banglasketch.com"
OFFICE_ADDRESS = "Hashem Mansion, Level-1, 48 Kazi Nazrul Islam Ave, Dhaka 1215, Bangladesh"

def is_bengali_text(text: str) -> bool:
    """Check if the text contains Bengali script characters."""
    return any('ঀ' <= char <= '৿' for char in text)

def _clean_text(text: str) -> str:
    """Normalize text for intent matching."""
    return text.lower().strip()

def contains_any(text: str, patterns: list) -> bool:
    """Check if text matches any keyword pattern with boundary safety."""
    for p in patterns:
        if p.isascii():
            if re.search(r"(?<!\w)" + re.escape(p) + r"s?(?!\w)", text):
                return True
        else:
            if p in text:
                return True
    return False

# Keywords for instant intents
GREETING_KEYWORDS = [
    "hi", "hello", "hey", "hola", "assalamu alaikum", "assalamualaikum", "asalamualaikom",
    "salam", "সালাম", "আসসালামু আলাইকুম", "নমস্কার", "nomoshkar", "kemon achen", "কেমন আছেন",
    "good morning", "good evening", "good afternoon"
]

CONTACT_KEYWORDS = [
    "phone", "number", "call", "mobile", "whatsapp", "contact", "email", "hotline",
    "ফোন", "নাম্বার", "মোবাইল", "যোগাযোগ", "কল", "হোয়াটসঅ্যাপ", "নাম্বার দিন", "কথা বলতে চাই",
    "phone number", "contact number", "call me"
]

LOCATION_KEYWORDS = [
    "address", "location", "office", "where are you", "where is your office", "directions",
    "ঠিকানা", "লোকেশন", "অফিস", "কোথায়", "কাজী নজরুল", "হাশেম ম্যানশন", "office kothay", "location kothay"
]

SITE_VISIT_KEYWORDS = [
    "site visit", "in-person site visit", "book a site visit", "book site visit",
    "schedule site visit", "site survey", "home visit", "visit my site",
    "appointment", "consultation booking", "studio consultation",
    "সাইট ভিজিট", "সাইট সার্ভে", "অ্যাপয়েন্টমেন্ট", "অ্যাপয়েন্টমেন্ট", "বাসায় আসবেন",
    "সরাসরি পরামর্শ", "ভিজিট বুক"
]

SERVICES_KEYWORDS = [
    "services", "service list", "what do you do", "what services", "scope of work",
    "সার্ভিস", "সেবা", "কী কী কাজ করেন", "কি কি কাজ করেন", "কাজের বিবরণ", "সেবাসমূহ"
]

PROCESS_KEYWORDS = [
    "process", "how it works", "how do you work", "workflow", "steps", "design process",
    "পদ্ধতি", "কাজের ধাপ", "কীভাবে কাজ করেন", "কাজের নিয়ম", "ওয়ার্কফ্লো"
]

BUDGET_KEYWORDS = [
    "cost per sqft", "sqft rate", "price per sqft", "per square feet", "cost estimate", "pricing guide",
    "প্রতি স্কয়ার ফিট", "স্কয়ার ফিট রেট", "খরচ কত", "বাজেট কেমন", "খরচ কেমন", "রেট কত",
    "square feet cost", "sqft cost", "budget estimate"
]

def classify_instant_reply(message: str) -> Optional[Tuple[str, str]]:
    """
    Classifies a message and returns (response_text, intent_name) if it matches a known fast intent.
    Returns None if the message requires Gemini AI for bespoke design advice.
    """
    cleaned = _clean_text(message)
    if not cleaned:
        return None

    is_bn = is_bengali_text(cleaned)

    # 1. Greetings (Exact short phrases or greeting triggers)
    if len(cleaned.split()) <= 4 and contains_any(cleaned, GREETING_KEYWORDS):
        if is_bn:
            reply = (
                "আসসালামু আলাইকুম! **বাংলা স্কেচ** আর্কিটেকচারাল স্টুডিওতে স্বাগতম। "
                "আমরা ঢাকায় আধুনিক রেসিডেনশিয়াল ও কমার্শিয়াল ইন্টেরিয়র ডিজাইন সেবা প্রদান করি। "
                "আপনি কোন ধরণের স্পেস (ফ্ল্যাট, কিচেন, বেডরুম কিংবা অফিস) সাজাতে চাচ্ছেন?"
            )
        else:
            reply = (
                "Hello & welcome to **Bangla Sketch Architectural Studio**! "
                "We provide bespoke residential and commercial interior architecture in Dhaka. "
                "Which space are you planning to transform (full apartment, modular kitchen, bedroom, or office)?"
            )
        return reply, "greeting"

    # 2. Contact / Phone / WhatsApp
    if contains_any(cleaned, CONTACT_KEYWORDS):
        if is_bn:
            reply = (
                f"আমাদের সাথে সরাসরি যোগাযোগ করতে পারেন:\n\n"
                f"- **ফোন / হটলাইন**: [{CONTACT_PHONE}](tel:{CONTACT_PHONE.replace('-', '')})\n"
                f"- **WhatsApp**: [{CONTACT_WHATSAPP}](https://wa.me/{CONTACT_WHATSAPP.replace('+', '')})\n"
                f"- **ইমেইল**: {CONTACT_EMAIL}\n\n"
                f"আমাদের সিনিয়র আর্কিটেক্টের সাথে সরাসরি কথা বলতে WhatsApp বাটনে ক্লিক করুন অথবা ফ্রি কনসালটেশনের জন্য /contact পেজে ফর্ম পূরণ করুন।"
            )
        else:
            reply = (
                f"You can reach our design studio directly:\n\n"
                f"- **Direct Phone**: [{CONTACT_PHONE}](tel:{CONTACT_PHONE.replace('-', '')})\n"
                f"- **WhatsApp Consultation**: [{CONTACT_WHATSAPP}](https://wa.me/{CONTACT_WHATSAPP.replace('+', '')})\n"
                f"- **Email**: {CONTACT_EMAIL}\n\n"
                f"Tap our WhatsApp link above to speak with a senior architect instantly, or submit your details at /contact for a callback."
            )
        return reply, "contact"

    # 3. Site Visit / Consultation Booking
    if contains_any(cleaned, SITE_VISIT_KEYWORDS):
        if is_bn:
            reply = (
                "**সাইট ভিজিট বুক করতে আমাদের টিমকে সরাসরি কল করুন।**\n\n"
                f"- **ফোন**: [{CONTACT_PHONE}](tel:{CONTACT_PHONE.replace('-', '')})\n"
                f"- **WhatsApp**: [{CONTACT_WHATSAPP}](https://wa.me/{CONTACT_WHATSAPP.replace('+', '')})\n\n"
                "সাইট ভিজিটের আগে লোকেশন, ফ্ল্যাট/রুমের আনুমানিক সাইজ, এবং আপনার কাজের ধরন জানালে আমাদের আর্কিটেক্ট দ্রুত সময় ঠিক করতে পারবেন।"
            )
        else:
            reply = (
                "**Yes, you can book an in-person site visit with Bangla Sketch.**\n\n"
                f"- **Call**: [{CONTACT_PHONE}](tel:{CONTACT_PHONE.replace('-', '')})\n"
                f"- **WhatsApp**: [{CONTACT_WHATSAPP}](https://wa.me/{CONTACT_WHATSAPP.replace('+', '')})\n\n"
                "Please share your location, approximate apartment or room size, and the type of work you need. Our architect can then confirm the earliest available visit slot."
            )
        return reply, "site_visit"

    # 4. Location / Office Address
    if contains_any(cleaned, LOCATION_KEYWORDS):
        if is_bn:
            reply = (
                f"**বাংলা স্কেচ স্টুডিও লোকেশন**:\n\n"
                f"📍 **ঠিকানা**: {OFFICE_ADDRESS}\n\n"
                f"🕒 **অফিস সময়**: শনি - বৃহস্পতি (সকাল ১০:০০ - রাত ৮:০০)\n\n"
                f"আমাদের স্টুডিও ভিজিট করতে বা সাইট কনসালটেশনের জন্য আগে থেকে কল করতে পারেন: [{CONTACT_PHONE}](tel:{CONTACT_PHONE.replace('-', '')})।"
            )
        else:
            reply = (
                f"**Bangla Sketch Studio Address**:\n\n"
                f"📍 **Location**: {OFFICE_ADDRESS}\n\n"
                f"🕒 **Studio Hours**: Saturday – Thursday (10:00 AM – 8:00 PM)\n\n"
                f"To schedule an in-person site visit or studio consultation, feel free to call us at [{CONTACT_PHONE}](tel:{CONTACT_PHONE.replace('-', '')})."
            )
        return reply, "location"

    # 5. Services Overview
    if contains_any(cleaned, SERVICES_KEYWORDS):
        if is_bn:
            reply = (
                "**আমাদের প্রধান ডিজাইন সেবাসমূহ**:\n\n"
                "- **কমপ্লিট ফ্ল্যাট ইন্টেরিয়র**: ২/৩ বেডরুম ও ডুপ্লেক্স বাড়ির সম্পূর্ণ আর্কিটেকচারাল সাজসজ্জা।\n"
                "- **মডার্ন কিচেন সলিউশন**: অ্যাক্রিলিক, ভেনিয়ার ও স্মার্ট স্টোরেজ কিচেন ক্যাবিনেট।\n"
                "- **বেডরুম ও লিভিং স্পেস**: কাস্টম ওয়ারড্রব, টিভি ইউনিট ও আধুনিক ফলস সিলিং লাইটিং।\n"
                "- **কমার্শিয়াল ও অফিস ইন্টেরিয়র**: আধুনিক ও প্রোডাক্টিভ অফিস সেটআপ।\n\n"
                "আমাদের রিয়েল প্রজেক্টগুলো দেখতে /portfolio ঘুরে আসুন অথবা বাজেটের হিসাব করতে /cost-estimator ব্যবহার করুন।"
            )
        else:
            reply = (
                "**Our Core Interior Design Services**:\n\n"
                "- **Full Apartment Interior**: Comprehensive architectural renovation for 2BHK/3BHK & duplex residences.\n"
                "- **Modular Kitchens**: Premium acrylic, veneer cabinetry, and smart ergonomic storage.\n"
                "- **Living & Bedroom Suites**: Custom wardrobes, acoustic headboards, and architectural lighting.\n"
                "- **Commercial & Corporate**: Inspiring office interiors, restaurants, and retail spaces.\n\n"
                "Explore our completed works at /portfolio or calculate room estimates with our /cost-estimator."
            )
        return reply, "services"

    # 6. Work Process / Workflow
    if contains_any(cleaned, PROCESS_KEYWORDS):
        if is_bn:
            reply = (
                "**আমাদের কাজের ৪টি সহজ ধাপ**:\n\n"
                "1. **পরামর্শ ও সাইট ভিজিট**: আপনার স্পেসের সঠিক পরিমাপ ও প্রয়োজনীয়তা আলোচনা।\n"
                "2. **২ডি লেআউট ও ৩ডি ভিজুয়ালাইজেশন**: ফটো-রিয়েলিস্টিক ৩ডি ডিজাইন তৈরি ও রিভিশন।\n"
                "3. **ম্যাটেরিয়াল সিলেক্ট ও এস্টিমেট (BOQ)**: স্বচ্ছ খরচের তালিকা ও ম্যাটেরিয়াল ফাইনাল করা।\n"
                "4. **বাস্তবায়ন ও হ্যান্ডওভার**: নিজস্ব কারিগর দ্বারা নির্ধারিত সময়ে নিখুঁত কাজ সম্পন্ন।\n\n"
                "আপনার প্রজেক্টের আলোচনা শুরু করতে /design-brief পূরণ করতে পারেন।"
            )
        else:
            reply = (
                "**Our 4-Step Design & Execution Process**:\n\n"
                "1. **Consultation & Site Survey**: We inspect your space, take precise measurements, and understand your lifestyle.\n"
                "2. **2D Layouts & 3D Visualization**: Photorealistic 3D renders customized to your taste.\n"
                "3. **Material Selection & Clear BOQ**: Transparent itemized quote with material specifications.\n"
                "4. **Execution & Handover**: Factory-finish production and on-time project handover.\n\n"
                "Ready to start? Submit a project brief at /design-brief or chat with us on WhatsApp."
            )
        return reply, "process"

    # 7. Budget & Sqft Pricing Guide
    if contains_any(cleaned, BUDGET_KEYWORDS):
        if is_bn:
            reply = (
                "**ঢাকায় ইন্টেরিয়র ডিজাইনের আনুমানিক খরচের ধারণা**:\n\n"
                "- **স্ট্যান্ডার্ড প্যাকেজ**: ১২০০ - ১৬০০ টাকা / স্কয়ার ফিট (কোয়ালিটি বোর্ড, আধুনিক ফিনিশ)\n"
                "- **প্রিমিয়াম প্যাকেজ**: ১৭০০ - ২৫০০ টাকা / স্কয়ার ফিট (হাই-গ্লস অ্যাক্রিলিক, প্রিমিয়াম লাইটিং)\n"
                "- **লাক্সারি কাস্টম**: ২৬০০+ টাকা / স্কয়ার ফিট (আমদানি করা ফিটিংস ও এক্সক্লুসিভ ভেনিয়ার)\n\n"
                "আপনার ফ্ল্যাট বা রুমের নির্দিষ্ট খরচের হিসাব জানতে আমাদের /cost-estimator ব্যবহার করুন অথবা সরাসরি /contact করুন।"
            )
        else:
            reply = (
                "**Estimated Interior Design Costs in Dhaka**:\n\n"
                "- **Standard Finish**: 1,200 – 1,600 BDT / sq ft (Quality board, functional modern layouts)\n"
                "- **Premium Finish**: 1,700 – 2,500 BDT / sq ft (High-gloss acrylic, veneer & layered lighting)\n"
                "- **Luxury Bespoke**: 2,600+ BDT / sq ft (Imported fittings, solid wood & smart automation)\n\n"
                "To calculate custom estimates for your space, use our /cost-estimator tool or reach us on WhatsApp."
            )
        return reply, "budget"

    return None
