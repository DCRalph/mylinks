import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { cache } from "react";

import { env } from "~/env";
import type { Domain } from "~/lib/domains";
import {
  ac,
  can,
  isStaff,
  parseRoles,
  roleInfo,
  roles,
} from "~/lib/permissions";
import { audit, describeUser } from "~/server/audit";
import { db } from "~/server/db";
import { getDomains } from "~/server/domains";
import { getSettings } from "~/server/settings";

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account" as const,
      }
    : undefined;

export const googleEnabled = !!google;

// Admin endpoints an admin must not aim at their own account.
const NOT_ON_SELF = new Set([
  "/admin/set-role",
  "/admin/ban-user",
  "/admin/remove-user",
  "/admin/impersonate-user",
]);

// Deleted users can't be looked up afterwards, so remember who they were.
const deletingUsers = new Map<string, string>();

const userIdFrom = (body: unknown) =>
  typeof body === "object" && body && "userId" in body
    ? String(body.userId)
    : null;

/** Audit entry for a successful better-auth admin call, or null to skip. */
async function describeAdminCall(path: string, body: Record<string, unknown>) {
  const userId = userIdFrom(body);
  const who = async () =>
    userId
      ? (deletingUsers.get(userId) ?? (await describeUser(userId)))
      : "a user";
  const target = userId ? { type: "user", id: userId } : undefined;

  switch (path) {
    case "/admin/set-role": {
      const role = Array.isArray(body.role) ? body.role : [body.role];
      const labels = parseRoles(role.join(",")).map((r) => roleInfo[r].label);
      return {
        action: "user.set-roles",
        target,
        summary: `Set roles of ${await who()} to ${labels.join(", ")}`,
      };
    }
    case "/admin/ban-user": {
      const seconds =
        typeof body.banExpiresIn === "number" ? body.banExpiresIn : null;
      const until = seconds
        ? ` until ${new Date(Date.now() + seconds * 1000).toDateString()}`
        : "";
      const reason =
        typeof body.banReason === "string" && body.banReason
          ? `: ${body.banReason}`
          : "";
      return {
        action: "user.ban",
        target,
        summary: `Banned ${await who()}${until}${reason}`,
      };
    }
    case "/admin/unban-user":
      return {
        action: "user.unban",
        target,
        summary: `Unbanned ${await who()}`,
      };
    case "/admin/revoke-user-sessions":
      return {
        action: "user.sign-out",
        target,
        summary: `Signed ${await who()} out everywhere`,
      };
    case "/admin/revoke-user-session":
      return {
        action: "user.sign-out",
        target,
        summary: `Ended one of ${await who()}'s sessions`,
      };
    case "/admin/impersonate-user":
      return {
        action: "user.impersonate",
        target,
        summary: `Viewed the app as ${await who()}`,
      };
    case "/admin/remove-user":
      return {
        action: "user.delete",
        target,
        summary: `Deleted ${await who()}`,
      };
    case "/admin/set-user-password":
      return {
        action: "user.set-password",
        target,
        summary: `Set a new password for ${await who()}`,
      };
    default:
      return null;
  }
}

/**
 * A better-auth instance serving `domains` (primary first). Built by getAuth,
 * since better-auth fixes its allowed hosts, and so its trusted origins, at
 * creation.
 */
function createAuth(domains: [Domain, ...Domain[]]) {
  const protocols = new Set(domains.map((domain) => domain.protocol));

  return betterAuth({
    appName: "link2it",
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(db, { provider: "postgresql" }),

    // Every active domain gets its own sign-in, cookies and OAuth callback
    // (https://<domain>/api/auth/callback/google must be registered with Google).
    // Requests on other hosts resolve to the primary domain.
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

    // Counters live in the database so restarts don't reset them. Only enforced
    // in production.
    rateLimit: { storage: "database" },

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
        requireSetup: { type: "boolean", defaultValue: true, input: false },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    databaseHooks: {
      user: {
        create: {
          // Admin → Settings can close sign-ups to new accounts.
          before: async () => {
            if ((await getSettings()).signUps === "closed") {
              throw new APIError("FORBIDDEN", {
                code: "SIGNUPS_CLOSED",
                message: "New sign-ups are closed.",
              });
            }
          },
        },
      },
    },

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (!ctx.path.startsWith("/admin/")) return;
        const userId = userIdFrom(ctx.body);
        const session = await getSessionFromCtx(ctx);
        if (!userId || !session) return;

        if (NOT_ON_SELF.has(ctx.path) && userId === session.user.id) {
          throw new APIError("FORBIDDEN", {
            message: "You can't do that to your own account",
          });
        }
        // Moderators can act on ordinary accounts, but not on other staff.
        // (Hook sessions are untyped, hence the check on role.)
        const role: unknown = session.user.role;
        const actor = { role: typeof role === "string" ? role : null };
        if (!can(actor, { user: ["set-role"] })) {
          const target = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          if (isStaff(target)) {
            throw new APIError("FORBIDDEN", {
              message: "Only admins can do that to staff accounts",
            });
          }
        }
        if (ctx.path === "/admin/remove-user") {
          deletingUsers.set(userId, await describeUser(userId));
        }
      }),
      // Every successful admin call lands in the audit log, whichever UI made it.
      after: createAuthMiddleware(async (ctx) => {
        if (!ctx.path.startsWith("/admin/")) return;
        if (ctx.context.returned instanceof APIError) return;
        const session = await getSessionFromCtx(ctx);
        const body = (ctx.body ?? {}) as Record<string, unknown>;
        const entry = await describeAdminCall(ctx.path, body);
        const userId = userIdFrom(body);
        if (userId) deletingUsers.delete(userId);
        if (entry) await audit({ actorId: session?.user.id ?? null, ...entry });
      }),
    },

    plugins: [
      // Roles and permissions live in src/lib/permissions.ts.
      admin({
        ac,
        roles,
        defaultRole: "user",
        adminRoles: ["admin"],
        bannedUserMessage: "This account has been suspended.",
      }),
      // Must stay last: lets server actions and RSC-triggered auth calls set cookies.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];

const current = globalThis as unknown as {
  auth?: { key: string; instance: Auth };
};

/** The better-auth instance for the active domains, rebuilt when they change. */
export async function getAuth() {
  const { active } = await getDomains();
  const key = active.map((domain) => domain.origin).join(",");
  if (current.auth?.key !== key) {
    current.auth = { key, instance: createAuth(active) };
  }
  return current.auth.instance;
}

/** Current session for server components and route handlers, deduped per request. */
export const getSession = cache(async () =>
  (await getAuth()).api.getSession({ headers: await headers() }),
);
