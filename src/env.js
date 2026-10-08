import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(32)
        : z.string().optional(),
    // Google sign-in is hidden unless both are set.
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },

  client: {
    // Comma-separated origins this deployment answers on, e.g.
    // "https://link2it.xyz,https://l2.it". Every domain serves the full app,
    // sign-in included, and resolves every short link. The first is the default.
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
          .min(1),
      ),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_DOMAINS: process.env.NEXT_PUBLIC_DOMAINS,
  },
  // Run `build` or `dev` with SKIP_ENV_VALIDATION to skip validation (e.g. Docker builds).
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  // Treat empty strings as undefined.
  emptyStringAsUndefined: true,
});
