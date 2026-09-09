import { proxyHeaders } from "@/lib/proxy-headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, getBackendUrl } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

function invalidateContent(path: string) {
  if (path.startsWith("projects")) { revalidatePath("/"); revalidatePath("/portfolio", "layout"); }
  if (path.startsWith("blog")) { revalidatePath("/"); revalidatePath("/blog", "layout"); }
  if (path.startsWith("testimonials") || path.startsWith("videos")) revalidatePath("/");
}

function sanitizeSubpath(segments: string[]): string | null {
  if (!segments || !segments.length) return null;
  for (const seg of segments) {
    if (!seg || seg === "." || seg === ".." || !/^[a-zA-Z0-9_\-]+$/.test(seg)) {
      return null;
    }
  }
  return segments.join("/");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const subpath = sanitizeSubpath(resolvedParams.path);
  if (!subpath) return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
  const search = req.nextUrl.search;

  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/${subpath}${search}`, {
      headers: { ...proxyHeaders(req), Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backend unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const subpath = sanitizeSubpath(resolvedParams.path);
  if (!subpath) return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/${subpath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...proxyHeaders(req),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (res.ok) invalidateContent(subpath);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backend unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const subpath = sanitizeSubpath(resolvedParams.path);
  if (!subpath) return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/${subpath}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...proxyHeaders(req),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (res.ok) invalidateContent(subpath);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backend unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const subpath = sanitizeSubpath(resolvedParams.path);
  if (!subpath) return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/${subpath}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...proxyHeaders(req),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (res.ok) invalidateContent(subpath);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backend unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { ok, token } = await verifyAdminSession(req);
  if (!ok) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const subpath = sanitizeSubpath(resolvedParams.path);
  if (!subpath) return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });

  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/${subpath}`, {
      method: "DELETE",
      headers: { ...proxyHeaders(req), Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (res.ok) invalidateContent(subpath);
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Backend unavailable";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
