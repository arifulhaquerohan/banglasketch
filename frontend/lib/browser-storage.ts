type StorageKind = "localStorage" | "sessionStorage";

/** Storage may be denied by privacy settings, sandboxing, or quota limits. */
export function readBrowserStorage(kind: StorageKind, key: string): string | null {
  try { return globalThis[kind].getItem(key); } catch { return null; }
}

export function writeBrowserStorage(kind: StorageKind, key: string, value: string): void {
  try { globalThis[kind].setItem(key, value); } catch { /* Keep controls usable in memory. */ }
}
