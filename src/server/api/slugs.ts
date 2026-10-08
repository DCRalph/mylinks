import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { can } from "~/lib/permissions";
import { MIN_SLUG_LENGTH } from "~/lib/validation";

export const randomSlug = () => randomUUID().slice(0, 8);

/** Only roles with link:short-slug may claim slugs under MIN_SLUG_LENGTH. */
export function assertSlugLength(slug: string, user: { role?: string | null }) {
  if (slug.length < MIN_SLUG_LENGTH && !can(user, { link: ["short-slug"] })) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Slug must be at least ${MIN_SLUG_LENGTH} characters`,
    });
  }
}
