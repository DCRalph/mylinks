import "server-only";

import { notFound, redirect } from "next/navigation";

import { can, type Permissions } from "~/lib/permissions";
import { getSession } from "~/server/auth";

/**
 * Gate for signed-in pages. Sends visitors to /signin and new users to /setup,
 * otherwise returns the session (user and session row).
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (session.user.requireSetup) redirect("/setup");
  return session;
}

export async function requireUser() {
  return (await requireSession()).user;
}

/** 404 unless the user's roles grant `permissions` (see src/lib/permissions.ts). */
export async function requirePermission(
  permissions: Permissions,
  options?: { any?: boolean },
) {
  const user = await requireUser();
  if (!can(user, permissions, options)) notFound();
  return user;
}
