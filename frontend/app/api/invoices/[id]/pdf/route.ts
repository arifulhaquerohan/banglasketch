import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
      return NextResponse.json({ success: false, error: "Invalid invoice ID" }, { status: 400 });
    }

    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${backendUrl}/api/invoices/${encodeURIComponent(id)}/pdf`, {
        method: "GET",
        headers: proxyHeaders(req),
        signal: AbortSignal.timeout(60_000),
        cache: "no-store",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, error: payload.error || "Unable to load invoice PDF" },
          { status: res.status }
        );
      }

      if (res.headers.get("content-type")?.includes("application/pdf")) {
        return new NextResponse(res.body, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": res.headers.get("content-disposition") || "inline",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Invoice service returned an invalid PDF response" },
        { status: 502 }
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice service is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
  }
}
