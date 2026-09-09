import { NextRequest, NextResponse } from "next/server";
import { proxyHeaders } from "@/lib/proxy-headers";
import { ADMIN_SESSION_COOKIE } from "../../../../lib/admin-auth";

function getBackendUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

function createSessionResponse(token: string, message = "Authenticated successfully") {
  // The backend JWT remains server-managed inside this httpOnly cookie. Never
  // return it in JSON or ask the browser to store privileged credentials.
  const response = NextResponse.json({ success: true, message });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { password, email, totp } = await req.json();
    if (typeof password !== "string" || !password.trim()) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";

    // The backend is the only authority for administrator credentials.
    try {
      const backendResponse = await fetch(`${getBackendUrl()}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...proxyHeaders(req),
          ...(userAgent ? { "user-agent": userAgent } : {}),
        },
        body: JSON.stringify({ password, email, totp }),
        cache: "no-store",
        signal: AbortSignal.timeout(6_000),
      });

      const data = await backendResponse.json().catch(() => ({}));

      if (backendResponse.ok && data?.success && typeof data.token === "string") {
        return createSessionResponse(data.token, data.message);
      }

      if (
        backendResponse.status === 401 ||
        backendResponse.status === 429 ||
        backendResponse.status === 400
      ) {
        return NextResponse.json(
          { success: false, error: data?.error || "Incorrect password. Please try again.", requiresTotp: Boolean(data?.requiresTotp) },
          { status: backendResponse.status }
        );
      }
    } catch {
      // Fail closed when the authentication service is unavailable.
    }

    return NextResponse.json({ success: false, error: "Authentication service unavailable" }, { status: 503 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
