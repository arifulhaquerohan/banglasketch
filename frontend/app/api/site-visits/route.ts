import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

function getBackendUrl() {
  const rawUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return rawUrl.replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${getBackendUrl()}/api/site-visits/slots/`, {
      headers: proxyHeaders(req),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Booking slots unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${getBackendUrl()}/api/site-visits/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...proxyHeaders(req) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to reserve site visit";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
