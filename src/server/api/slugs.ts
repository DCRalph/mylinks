import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { MIN_SLUG_LENGTH } from "~/lib/validation";

export const randomSlug = () => randomUUID().slice(0, 8);

/** Admins may claim slugs shorter than MIN_SLUG_LENGTH; everyone else may not. */
export function assertSlugLength(slug: string, isAdmin: boolean) {
  if (!isAdmin && slug.length < MIN_SLUG_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Slug must be at least ${MIN_SLUG_LENGTH} characters`,
    });
  }
}
