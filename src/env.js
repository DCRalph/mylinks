import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Deployments from before better-auth set one app URL and one short host
 * (NEXT_PUBLIC_DOMAIN / NEXT_PUBLIC_SHORT_DOMAIN). Turn those into the
 * NEXT_PUBLIC_DOMAINS list so they keep working without env changes.
 */
function legacyDomains() {
  const app = process.env.NEXT_PUBLIC_DOMAIN;
  if (!app) return undefined;
  const short = process.env.NEXT_PUBLIC_SHORT_DOMAIN?.replace(/^https?:\/\//, "");
  const protocol = app.startsWith("http://") ? "http://" : "https://";
  return short ? `${app},${protocol}${short}` : app;
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // better-auth warns at startup if this is short or low-entropy.
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    // Google sign-in is hidden unless both are set.
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },

  client: {
    // Comma-separated origins, e.g. "https://link2it.xyz,https://l2.it", the
    // first being primary. Seeds the Domain table on first boot (Admin →
    // Domains), and is the fallback if no domain is active.
    NEXT_PUBLIC_DOMAINS: z
      .string()
      .transform((value) =>
        value
          .split(",")
          .map((domain) => domain.trim())
          .filter(Boolean),
      )
      .pipe(
        z
          .array(
            z
              .url({ protocol: /^https?$/ })
              .transform((url) => new URL(url).origin),
          )
          .min(1)
          .transform((origins) => [...new Set(origins)]),
      ),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Falls back to the NextAuth secret from older deployments.
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_DOMAINS: process.env.NEXT_PUBLIC_DOMAINS || legacyDomains(),
  },
  // Run `build` or `dev` with SKIP_ENV_VALIDATION to skip validation (e.g. Docker builds).
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  // Treat empty strings as undefined.
  emptyStringAsUndefined: true,
});
