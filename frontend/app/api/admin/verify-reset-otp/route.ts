import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));



    const res = await fetch(`${getBackendUrl()}/api/admin/verify-reset-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...proxyHeaders(req),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));



    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to authentication server";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
