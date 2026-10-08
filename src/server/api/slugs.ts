import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { can } from "~/lib/permissions";
import { MIN_SLUG_LENGTH } from "~/lib/validation";
import { getSettings } from "~/server/settings";

export const randomSlug = () => randomUUID().slice(0, 8);

const badRequest = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

/**
 * Rules for a link or profile slug beyond its format: the length minimum
 * (roles with link:short-slug skip it) and Admin → Settings' reserved slugs.
 */
export async function assertSlugAllowed(
  slug: string,
  user: { role?: string | null },
) {
  if (slug.length < MIN_SLUG_LENGTH && !can(user, { link: ["short-slug"] })) {
    throw badRequest(`Slug must be at least ${MIN_SLUG_LENGTH} characters`);
  }
  const { reservedSlugs } = await getSettings();
  if (reservedSlugs.includes(slug.toLowerCase())) {
    throw badRequest("That slug is reserved");
  }
}

/** Short links can't point at URLs containing a blocked word or domain (Admin → Settings). */
export async function assertUrlAllowed(url: string) {
  const { blockedUrls } = await getSettings();
  const lower = url.toLowerCase();
  if (blockedUrls.some((blocked) => lower.includes(blocked.toLowerCase()))) {
    throw badRequest("That URL is not allowed");
  }
}
