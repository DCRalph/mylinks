import { z } from "zod";

import { isLocalHost, normalizeHost } from "~/lib/domains";
import badWords from "~/utils/badWords";
import { profileLinkIcons } from "~/utils/profileLinkIcons";

const handle = z
  .string()
  .trim()
  .max(20, "Must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]*$/, "Only letters, numbers and underscores");

export const usernameSchema = handle
  .min(3, "Must be at least 3 characters")
  .refine(
    (name) => !badWords.badUsernames.includes(name.toLowerCase()),
    "That username is reserved",
  );

/**
 * Short link and profile slugs, which share the URL space with app routes.
 * Empty means "generate one". The server also applies the length minimum and
 * Admin → Settings' reserved slugs (`assertSlugAllowed` in src/server/api/slugs.ts).
 */
export const slugSchema = handle.refine(
  (slug) => !badWords.badSlugs.includes(slug.toLowerCase()),
  "That slug is reserved",
);

export const MIN_SLUG_LENGTH = 3;

export const httpUrlSchema = z.url({
  protocol: /^https?$/,
  error: "Enter a full http(s) URL",
});

/** Profile buttons may also open mail or the phone dialer, never javascript:. */
export const profileLinkUrlSchema = z.url({
  protocol: /^(https?|mailto|tel)$/,
  error: "Enter a full URL (https://, mailto: or tel:)",
});

/** Short link destinations. Blocked URLs (Admin → Settings) are checked on the server. */
export const linkUrlSchema = httpUrlSchema;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

const emptyToNull = z.literal("").transform(() => null);

/** "#c8f560" style colours for profile buttons. Empty means the default. */
export const colorSchema = z.union([
  emptyToNull,
  z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #c8f560"),
]);

/** One of the bundled icons. Empty means none. */
export const iconSchema = z.union([
  emptyToNull,
  z.enum(profileLinkIcons.map((icon) => icon.file)),
]);

const hostname =
  /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

/** A domain to add in Admin → Domains. Accepts pasted URLs; IP addresses aren't allowed. */
export const domainHostSchema = z
  .string()
  .transform(normalizeHost)
  .refine(
    (host) => hostname.test(host) || isLocalHost(host),
    "Enter a domain like go.example.com",
  );
