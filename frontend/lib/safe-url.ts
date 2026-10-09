/** Validate CMS/chat links using the same URL normalization as the browser. */
export function isSafePublicHref(value: string): boolean {
  if (!value || /[\\\u0000-\u0020\u007f]/.test(value)) return false;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return true;
  if (/^tel:\+?[0-9().\-]+$/i.test(value)) return true;
  try {
    const base = "https://local.invalid";
    const url = new URL(value, base);
    if (url.username || url.password) return false;
    if (value.startsWith("/") && !value.startsWith("//")) return url.origin === base;
    return /^https?:\/\//i.test(value) && ["http:", "https:"].includes(url.protocol);
  } catch { return false; }
}
