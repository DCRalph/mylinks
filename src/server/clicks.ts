import "server-only";

import { z } from "zod";

import { requestHost } from "~/lib/domains";
import { visitColumns } from "~/lib/user-agent";
import { db } from "~/server/db";
import { getSettings } from "~/server/settings";

// Headers that carry the visitor's IP address.
export const IP_HEADERS = [
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
  "true-client-ip",
  "forwarded",
];

/**
 * Visitor details stored with each Click (short link hit, profile view, pixel
 * load), parsed once so analytics can group by them. Follows Admin → Settings:
 * with IPs set to "none" none are kept, and unless they're "full" the copied
 * headers leave them out (the IP column is the one the retention job trims).
 */
export async function visitorInfo(
  headers: Headers,
  { withHeaders = false } = {},
) {
  const { ipAddresses } = await getSettings();
  const userAgent = headers.get("user-agent");
  const referer = headers.get("referer");
  const country = headers.get("cf-ipcountry");

  return {
    userAgent,
    referer,
    ...visitColumns(userAgent, referer),
    // Cloudflare sets cf-connecting-ip; otherwise the first forwarded hop is the client.
    ipAddress:
      ipAddresses === "none"
        ? null
        : (headers.get("cf-connecting-ip") ??
          headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headers.get("x-real-ip")),
    // XX means unknown and T1 is Tor; neither is a country.
    country:
      country && /^[A-Z]{2}$/.test(country) && country !== "XX"
        ? country
        : null,
    host: requestHost(headers) || null,
    ...(withHeaders && {
      allHeaders: JSON.stringify(
        withoutIps(safeHeaders(headers), ipAddresses !== "full"),
      ),
    }),
  };
}

/** Browsers fetching a link ahead of a click. Not a visit, so not recorded. */
export const isPrefetch = (headers: Headers) =>
  /prefetch|prerender/.test(
    `${headers.get("sec-purpose")} ${headers.get("purpose")} ${headers.get("x-moz")}`,
  );

/**
 * Fills the parsed columns on clicks recorded before they existed, one user
 * agent at a time. Runs in the background after boot; a no-op once done.
 */
export async function backfillClicks() {
  for (;;) {
    const batch = await db.click.findMany({
      where: { device: null },
      select: { userAgent: true },
      distinct: ["userAgent"],
      take: 200,
    });
    if (batch.length === 0) return;
    for (const { userAgent } of batch) {
      // refererHost was filled in by the migration.
      const { isBot, client, os, device } = visitColumns(userAgent, null);
      await db.click.updateMany({
        where: { device: null, userAgent },
        data: { isBot, client, os, device },
      });
    }
  }
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

/** `headers` without the ones carrying IP addresses, when `strip` is set. */
export function withoutIps(headers: Record<string, string>, strip = true) {
  if (!strip) return headers;
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([name]) => !IP_HEADERS.includes(name.toLowerCase()),
    ),
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
