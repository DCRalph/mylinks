import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "~/lib/permissions";
import type { Auth } from "~/server/auth";

// No baseURL: requests go to whichever domain the page was loaded from.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>(), adminClient({ ac, roles })],
});

/**
 * Turns a better-auth client result ({ data, error }) into a value or a thrown
 * Error, so calls work as React Query query and mutation functions.
 */
export async function unwrap<T>(
  request: Promise<
    | { data: T; error: null }
    | { data: null; error: { message?: string | undefined } }
  >,
) {
  const result = await request;
  if (result.error) {
    throw new Error(result.error.message ?? "Something went wrong");
  }
  return result.data;
}
