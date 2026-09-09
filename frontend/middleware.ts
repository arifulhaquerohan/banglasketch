import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const parsed = new URL(origin);
        if (parsed.host !== request.headers.get("host") || !["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json({ success: false, error: "Origin not allowed" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ success: false, error: "Origin not allowed" }, { status: 403 });
      }
    }
  }

  // Protect all /admin routes except /admin/login and /admin assets
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get("bs_admin_session");

    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
