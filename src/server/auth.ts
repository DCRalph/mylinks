import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { cache } from "react";

import { env } from "~/env";
import { domains } from "~/lib/domains";
import { db } from "~/server/db";

const protocols = new Set(domains.map((domain) => domain.protocol));

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account" as const,
      }
    : undefined;

export const googleEnabled = !!google;

export const auth = betterAuth({
  appName: "link2it",
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),

  // Every configured domain gets its own sign-in, cookies and OAuth callback
  // (https://<domain>/api/auth/callback/google must be registered with Google).
  // Requests on unknown hosts resolve to the first domain.
  baseURL: {
    allowedHosts: domains.map((domain) => domain.origin),
    // Pin the protocol when every domain agrees, so a TLS-terminating proxy that
    // talks plain http to the app can't produce http:// callback URLs.
    protocol: protocols.size === 1 ? [...protocols][0] : "auto",
    fallback: domains[0].origin,
  },
  advanced: {
    // Behind a reverse proxy the public host arrives in x-forwarded-host. It is
    // still checked against allowedHosts.
    trustedProxyHeaders: true,
  },

  emailAndPassword: {
    enabled: true,
    // New accounts come from Google, which verifies the email. An open password
    // sign-up without email verification would let someone pre-register a
    // victim's address and stay linked to it after they sign in with Google.
    disableSignUp: true,
    minPasswordLength: 8,
    password: {
      hash: hashPassword,
      // Passwords set before the move to better-auth are bcrypt hashes.
      verify: ({ hash, password }) =>
        hash.startsWith("$2")
          ? compare(password, hash)
          : verifyPassword({ hash, password }),
    },
  },

  socialProviders: google ? { google } : undefined,

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  user: {
    // Requires the current password, or a sign-in within the last day.
    deleteUser: { enabled: true },
    additionalFields: {
      username: { type: "string", required: false, input: false },
      admin: { type: "boolean", defaultValue: false, input: false },
      spyPixel: { type: "boolean", defaultValue: false, input: false },
      requireSetup: { type: "boolean", defaultValue: true, input: false },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  // Must stay last: lets server actions and RSC-triggered auth calls set cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

/** Current session for server components and route handlers, deduped per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
