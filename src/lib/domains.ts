import { env } from "~/env";

export type Domain = {
  /** e.g. "https://l2.it" */
  origin: string;
  /** e.g. "l2.it", what users see and type */
  host: string;
  protocol: "http" | "https";
};

/** Every domain this deployment serves, from NEXT_PUBLIC_DOMAINS. Never empty. */
export const domains = env.NEXT_PUBLIC_DOMAINS.map((origin): Domain => {
  const url = new URL(origin);
  return {
    origin,
    host: url.host,
    protocol: url.protocol === "http:" ? "http" : "https",
  };
}) as [Domain, ...Domain[]];

export const findDomain = (host: string | null | undefined) =>
  domains.find((domain) => domain.host === host?.toLowerCase());

/** Public URL for a short link or profile on the given domain. */
export const shareUrl = (domain: Domain, path: string) =>
  `${domain.origin}/${path.replace(/^\//, "")}`;
