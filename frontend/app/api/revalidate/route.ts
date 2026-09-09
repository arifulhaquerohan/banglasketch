import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
export async function POST(req: NextRequest) {
  if (!process.env.REVALIDATE_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.REVALIDATE_SECRET}`) return NextResponse.json({ success: false }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const paths = Array.isArray(body.paths) ? body.paths.filter((path: unknown): path is string => typeof path === "string" && /^\/(?:$|blog(?:\/.*)?$|portfolio(?:\/.*)?$)/.test(path)).slice(0, 10) : [];
  for (const path of paths) revalidatePath(path, "layout");
  return NextResponse.json({ success: true, revalidated: paths });
}
