import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session_id = body.session_id;
    const message = body.message;
    if (!session_id || !message) {
      return NextResponse.json({ success: false, error: "Missing session_id or message" }, { status: 400 });
    }

    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${backendUrl}/api/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
      body: JSON.stringify({ session_id, message }),
      signal: AbortSignal.timeout(30_000),
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
        return NextResponse.json({ success: false, error: payload.error || "Chat is temporarily unavailable. Please try again." }, { status: res.status });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ success: false, error: "Proxy error" }, { status: 503 });
  }
}

// Opening the widget only loads public projects; it does not call the AI.
export async function GET() {
  try {
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/api/chat/`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("Portfolio unavailable");
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ success: false, projects: [] }, { status: 503 });
  }
}
