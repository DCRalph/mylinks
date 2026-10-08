export type Domain = {
  /** e.g. "https://l2.it" */
  origin: string;
  /** e.g. "l2.it", what users see and type */
  host: string;
  protocol: "http" | "https";
};

export const toDomain = (host: string, protocol: string): Domain => {
  const scheme = protocol === "http" ? "http" : "https";
  return { origin: `${scheme}://${host}`, host, protocol: scheme };
};

/** Local development hosts, served over plain http. */
export const isLocalHost = (host: string) =>
  /^([a-z0-9-]+\.)*localhost(:\d+)?$/.test(host);

export const protocolFor = (host: string) =>
  isLocalHost(host) ? "http" : "https";

/** "https://Go.Example.com/path" -> "go.example.com" */
export const normalizeHost = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.$/, "");

/** Public URL for a short link or profile on the given domain. */
export const shareUrl = (domain: Domain, path: string) =>
  `${domain.origin}/${path.replace(/^\//, "")}`;

/** The public host of a request. Behind the reverse proxy it's in x-forwarded-host. */
export const requestHost = (headers: Headers) =>
  normalizeHost(
    headers.get("x-forwarded-host")?.split(",")[0] ?? headers.get("host") ?? "",
  );

/**
 * localhost and private or loopback IPs, as used by the hosting platform's
 * health checks. These always reach the app, which treats them as the primary
 * domain.
 */
export const isInternalHost = (host: string) =>
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\])(:\d+)?$/.test(
    host,
  );
