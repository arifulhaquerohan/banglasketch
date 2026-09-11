import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl, verifyAdminSession } from "@/lib/admin-auth";
import { proxyHeaders } from "@/lib/proxy-headers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ success: false, error: "Invalid request origin" }, { status: 403 });
  }
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  // Bound the entire multipart body before parsing it, even without Content-Length.
  const maxBody = 11 * 1024 * 1024;
  const tooLarge = () => NextResponse.json({ success: false, error: "Image must be 10 MB or smaller" }, { status: 413 });
  if (Number(req.headers.get("content-length")) > maxBody) return tooLarge();
  if (!req.body) return NextResponse.json({ success: false, error: "Missing upload" }, { status: 400 });
  try {
    const reader = req.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBody) { await reader.cancel(); return tooLarge(); }
      chunks.push(new Uint8Array(value));
    }
    const form = await new Response(new Blob(chunks), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Select an image no larger than 10 MB" }, { status: 400 });
    }
    const upload = new FormData();
    upload.set("file", file);
    upload.set("folder", String(form.get("folder") || "general"));
    const response = await fetch(`${getBackendUrl()}/api/admin/upload`, {
      method: "POST",
      headers: { ...proxyHeaders(req), Authorization: `Bearer ${token}` },
      body: upload,
      signal: AbortSignal.timeout(60_000),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Upload failed. Please retry with a supported image." }, { status: 502 });
  }
}
