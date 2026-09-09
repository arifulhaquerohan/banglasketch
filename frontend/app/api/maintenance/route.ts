import { NextRequest, NextResponse } from "next/server";
import { getMaintenanceConfigSync, saveMaintenanceConfigSync } from "../../../lib/maintenance";
import { verifyAdminSession, getBackendUrl } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getMaintenanceConfigSync();
    return NextResponse.json({ success: true, data: config }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch maintenance status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = saveMaintenanceConfigSync(body);

    if (token) {
      try {
        await fetch(`${getBackendUrl()}/api/admin/settings/maintenance`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updated),
          signal: AbortSignal.timeout(3_000),
        });
      } catch {
        // Fallback still succeeds with local file persistence
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error saving maintenance settings:", err);
    return NextResponse.json({ success: false, error: "Failed to save maintenance settings" }, { status: 500 });
  }
}

