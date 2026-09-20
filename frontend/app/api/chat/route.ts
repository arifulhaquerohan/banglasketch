import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session_id = body.session_id;
    const message = body.message;
    if (
      typeof session_id !== "string" ||
      !/^[a-f0-9]{32}$/.test(session_id) ||
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 4000
    ) {
      return NextResponse.json({ success: false, error: "Missing session_id or message" }, { status: 400 });
    }

    const rawUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const backendUrl = rawUrl.replace(/\/+$/, "");
    const res = await fetch(`${backendUrl}/api/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
      body: JSON.stringify({ session_id, message: message.trim() }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: payload.error || "Chat is temporarily unavailable. Please try again or reach us on WhatsApp.",
        }, { status: res.status });
    }

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({
      success: false,
      isTimeout,
      error: isTimeout
        ? "The response took longer than expected. Please connect directly with our architects on WhatsApp."
        : "Chat is temporarily reconnecting. Please retry or contact our studio on WhatsApp.",
    }, { status: 503 });
  }
}

// Opening the widget only loads public projects; it does not call the AI.
export async function GET() {
  try {
    const rawUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const backendUrl = rawUrl.replace(/\/+$/, "");
    const response = await fetch(`${backendUrl}/api/chat/`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("Portfolio unavailable");
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ success: false, projects: [] }, { status: 200 });
  }
}
