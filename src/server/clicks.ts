import "server-only";

/** Visitor details stored with each Click (short link hit, profile view, pixel load). */
export function visitorInfo(headers: Headers) {
  return {
    userAgent: headers.get("user-agent"),
    // First hop is the client when behind a proxy.
    ipAddress:
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headers.get("x-real-ip"),
    referer: headers.get("referer"),
  };
}
