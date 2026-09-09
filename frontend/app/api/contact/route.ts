import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const serviceType = typeof body.serviceType === "string" ? body.serviceType.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const website = typeof body.website === "string" ? body.website : "";
    const startedAt = typeof body.started_at === "number" ? body.started_at : undefined;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
    }

    if (
      name.length > MAX_FIELD_LENGTH ||
      email.length > MAX_FIELD_LENGTH ||
      phone.length > MAX_FIELD_LENGTH ||
      serviceType.length > MAX_FIELD_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        { success: false, error: "One or more fields are too long" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
        body: JSON.stringify({ name, email, phone, service_type: serviceType, message, website, started_at: startedAt }),
        signal: AbortSignal.timeout(10_000),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: payload.error || "Unable to submit your inquiry. Please try again." },
          { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
        );
      }

      return NextResponse.json({
        success: true,
        id: payload.id,
        message: payload.message || "Thank you! Your inquiry has been received.",
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Our inquiry service is temporarily unavailable. Please try again shortly or contact us directly.",
        },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
