import type { NextRequest } from "next/server";
// Enable only behind an ingress that overwrites X-Real-IP; never expose Next directly.
export function proxyHeaders(req: NextRequest): Record<string, string> {
  const ip = process.env.TRUST_INGRESS_IP === "true" ? req.headers.get("x-real-ip") : null;
  return ip ? { "x-forwarded-for": ip } : {};
}
