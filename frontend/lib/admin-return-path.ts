/** Restrict post-login navigation to this site's admin pages. */
export function adminReturnPath(value: string | null): string {
  if (!value || /[\\\u0000-\u0020]/.test(value)) return "/admin";
  try {
    const url = new URL(value, "https://admin.invalid");
    if (url.origin !== "https://admin.invalid" || !value.startsWith("/")) return "/admin";
    if (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/")) return "/admin";
    if (url.pathname === "/admin/login") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/admin"; }
}
