import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !EMAIL_PATTERN.test(email) || email.length > 160) {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
    }

    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(10_000),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: payload.error || "Unable to subscribe right now. Please try again." },
          { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: payload.message || "Subscribed successfully",
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Newsletter service is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
