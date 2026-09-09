import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/api/v1/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: payload.error || "Unable to submit your enquiry. Please try again." },
          { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
        );
      }

      return NextResponse.json(payload, { status: res.status });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Our consultation service is temporarily unavailable. Please try again shortly or contact us directly.",
        },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
