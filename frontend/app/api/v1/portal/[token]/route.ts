import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return NextResponse.json({ success: false, error: "Invalid portal link" }, { status: 400 });
    }

    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/api/v1/portal/${encodeURIComponent(token)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: payload.error || "Unable to load client portal" },
          { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
        );
      }

      return NextResponse.json(payload, { status: res.status });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Client portal service is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
