import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, getBackendUrl, ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${getBackendUrl()}/api/admin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...proxyHeaders(req),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));



    const response = NextResponse.json(data, { status: res.status });
    if (res.ok && data.success) response.cookies.delete(ADMIN_SESSION_COOKIE);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
