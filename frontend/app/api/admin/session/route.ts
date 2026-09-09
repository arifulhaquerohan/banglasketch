import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { ok } = await verifyAdminSession(request);
  if (!ok) {
    return NextResponse.json({ authenticated: false, reason: "invalid_credentials" }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}

