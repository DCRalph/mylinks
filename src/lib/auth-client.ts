import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "~/server/auth";

// No baseURL: requests go to whichever domain the page was loaded from.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
