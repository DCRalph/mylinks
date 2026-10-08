import "server-only";

import { redirect } from "next/navigation";

import { getSession } from "~/server/auth";

/**
 * Gate for signed-in pages. Sends visitors to /signin and new users to /setup,
 * otherwise returns the user (with admin/spyPixel flags).
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (session.user.requireSetup) redirect("/setup");
  return session.user;
}
