import "server-only";

import { createHmac, randomBytes, randomUUID } from "crypto";
import { z } from "zod";

import { env } from "~/env";
import { toDomain, type Domain } from "~/lib/domains";
import { db } from "~/server/db";

export type DomainSet = {
  /** Domains that serve the app, primary first. Never empty. */
  active: [Domain, ...Domain[]];
  /** Added but not verified yet: these only answer /api/domains/verify. */
  pending: Set<string>;
  loadedAt: number;
};

const TTL_MS = 30_000;
// Unknown hosts trigger a reload at most this often, so a domain added in the
// admin console is reachable straight away even where the cache isn't shared.
const RECHECK_MS = 5_000;

/**
 * NEXT_PUBLIC_DOMAINS: seeds the Domain table on first boot, and serves as the
 * fallback if no domain is active, so the site can't lock itself out.
 */
const envDomains = env.NEXT_PUBLIC_DOMAINS.map((origin) => {
  const url = new URL(origin);
  return toDomain(url.host, url.protocol.replace(":", ""));
}) as [Domain, ...Domain[]];

// On globalThis so the proxy and route handlers share one cache.
const cache = globalThis as unknown as {
  domainSet?: DomainSet;
  domainLoad?: Promise<DomainSet>;
};

async function load(): Promise<DomainSet> {
  const rows = await db.domain.findMany({
    where: { status: { in: ["active", "pending"] } },
    orderBy: [{ primary: "desc" }, { createdAt: "asc" }],
  });
  const [first, ...rest] = rows
    .filter((row) => row.status === "active")
    .map((row) => toDomain(row.host, row.protocol));

  return {
    active: first ? [first, ...rest] : envDomains,
    pending: new Set(
      rows.filter((row) => row.status === "pending").map((row) => row.host),
    ),
    loadedAt: Date.now(),
  };
}

/** Active and pending domains, cached for 30 seconds. */
export async function getDomains({ fresh = false } = {}) {
  const current = cache.domainSet;
  if (current && !fresh && Date.now() - current.loadedAt < TTL_MS) {
    return current;
  }
  cache.domainLoad ??= load()
    .then((set) => (cache.domainSet = set))
    .finally(() => (cache.domainLoad = undefined));
  return cache.domainLoad;
}

/** Call after changing the Domain table. */
export function invalidateDomains() {
  cache.domainSet = undefined;
}

const statusIn = (set: DomainSet, host: string) =>
  set.active.some((domain) => domain.host === host)
    ? "active"
    : set.pending.has(host)
      ? "pending"
      : null;

/** How the proxy should treat a request's host. */
export async function hostStatus(host: string) {
  const set = await getDomains();
  const status = statusIn(set, host);
  if (status || Date.now() - set.loadedAt < RECHECK_MS) return status;
  return statusIn(await getDomains({ fresh: true }), host);
}

/** First boot: copy NEXT_PUBLIC_DOMAINS into the Domain table. */
export async function seedDomains() {
  if ((await db.domain.count()) > 0) return;
  await db.domain.createMany({
    data: envDomains.map((domain, index) => ({
      host: domain.host,
      protocol: domain.protocol,
      status: "active",
      primary: index === 0,
      verifiedAt: new Date(),
    })),
  });
  invalidateDomains();
}

// Signs verify responses, so only this deployment can produce a valid one.
const verifyKey = ((
  globalThis as unknown as { domainVerifyKey?: string }
).domainVerifyKey ??=
  env.BETTER_AUTH_SECRET ?? randomBytes(32).toString("hex"));

/** What /api/domains/verify on `host` answers for `nonce`. */
export const domainProof = (host: string, nonce: string) =>
  createHmac("sha256", verifyKey).update(`${host}\n${nonce}`).digest("hex");

const proofResponse = z.object({ proof: z.string() });

/**
 * Fetches /api/domains/verify on the domain itself. Succeeds only if DNS,
 * HTTPS and the hosting all route the domain to this deployment. Returns null
 * on success, otherwise what went wrong.
 */
export async function checkDomain(host: string, protocol: string) {
  const nonce = randomUUID();
  try {
    const response = await fetch(
      `${protocol}://${host}/api/domains/verify?nonce=${nonce}`,
      {
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) {
      return `${host} answered with HTTP ${response.status}, so it isn't reaching this site yet.`;
    }
    const body = proofResponse.safeParse(
      await response.json().catch(() => null),
    );
    return body.success && body.data.proof === domainProof(host, nonce)
      ? null
      : `Something answers on ${host}, but it isn't this site.`;
  } catch (error) {
    return describeFetchError(host, error);
  }
}

function describeFetchError(host: string, error: unknown) {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return `${host} didn't answer within 8 seconds.`;
  }
  const cause = error instanceof Error ? error.cause : undefined;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : "";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return `${host} has no DNS record yet.`;
  }
  if (code === "ECONNREFUSED") return `Nothing is listening on ${host}.`;
  if (/CERT|TLS|SSL/.test(code)) return `HTTPS isn't working on ${host} yet.`;
  return `Couldn't reach ${host}${code ? ` (${code})` : ""}.`;
}
