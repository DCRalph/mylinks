import "server-only";

import { z } from "zod";

/** Visitor details stored with each Click (short link hit, profile view, pixel load). */
export function visitorInfo(headers: Headers) {
  return {
    userAgent: headers.get("user-agent"),
    // Cloudflare sets cf-connecting-ip; otherwise the first forwarded hop is the client.
    ipAddress:
      headers.get("cf-connecting-ip") ??
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip"),
    referer: headers.get("referer"),
  };
}

// Never keep credentials that happen to ride along on a request, e.g. the
// owner's own session cookie when they load their pixel while signed in.
const SENSITIVE = new Set(["cookie", "authorization", "proxy-authorization"]);

/** Request headers worth keeping for a pixel load, with credentials removed. */
export function safeHeaders(
  headers: Headers | Record<string, string>,
): Record<string, string> {
  const entries =
    headers instanceof Headers ? [...headers] : Object.entries(headers);
  return Object.fromEntries(
    entries.filter(([name]) => !SENSITIVE.has(name.toLowerCase())),
  );
}

const storedHeaders = z.record(z.string(), z.string());

/** Parses Click.allHeaders back into a header map, or null if absent or corrupt. */
export function readStoredHeaders(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = storedHeaders.safeParse(JSON.parse(raw));
    return parsed.success ? safeHeaders(parsed.data) : null;
  } catch {
    return null;
  }
}
