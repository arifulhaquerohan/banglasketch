import { proxyHeaders } from "./proxy-headers";
import { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "bs_admin_session";

function getBackendUrl(): string {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

/**
 * Validates the admin session against the authoritative Express backend.
 */
export async function verifyAdminSession(
  request: NextRequest
): Promise<{ ok: boolean; token?: string }> {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) return { ok: false };

  // 1. Verify against Express backend
  try {
    const backendRes = await fetch(`${getBackendUrl()}/api/admin/verify`, {
      headers: { ...proxyHeaders(request), Authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (backendRes.ok) {
      return { ok: true, token: sessionToken };
    }
  } catch {
    // Backend offline or unreachable
  }

  return { ok: false };
}

export { ADMIN_SESSION_COOKIE, getBackendUrl };

