import { parseUserAgent } from "~/lib/user-agent";

const numberFormat = new Intl.NumberFormat("en");

/** 1284 -> "1,284" */
export const formatNumber = (n: number) => numberFormat.format(n);

/** Host of a URL without "www.", or the input if it isn't a URL. */
export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** URL without the protocol, for display: "github.com/alice". */
export const displayUrl = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 hours ago", "yesterday", "just now". */
export function formatRelative(date: Date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000);
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

/** Rough device class from a user agent string. */
export const deviceType = (userAgent: string | null) =>
  parseUserAgent(userAgent).device;

/** Percentage change, rounded. 0 -> n counts as +100%. */
export function growth(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/** "Ōtautahi Café" -> "otautahi_cafe", trimmed to the 20 character slug limit. */
export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

/** Gobold size for a short link on a ticket, so long ones still fit. */
export const ticketTextSize = (shortLink: string) =>
  shortLink.length <= 15
    ? "text-[34px]"
    : shortLink.length <= 21
      ? "text-[28px]"
      : "text-[23px]";

/** plural(1, "link") -> "1 link", plural(3, "link") -> "3 links" */
export const plural = (n: number, word: string) =>
  `${formatNumber(n)} ${n === 1 ? word : `${word}s`}`;
