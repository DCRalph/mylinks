import "server-only";

import { db } from "~/server/db";

// Slugs are displayed in an all-caps typeface, so people may type them in any
// case. Exact matches win; otherwise fall back to a case-insensitive match.

const insensitive = (slug: string) => ({
  slug: { equals: slug, mode: "insensitive" as const },
});

export async function findLinkBySlug(slug: string) {
  return (
    (await db.link.findUnique({ where: { slug } })) ??
    (await db.link.findFirst({ where: insensitive(slug) }))
  );
}

export async function findProfileIdBySlug(slug: string) {
  const select = { id: true } as const;
  const profile =
    (await db.profile.findUnique({ where: { slug }, select })) ??
    (await db.profile.findFirst({ where: insensitive(slug), select }));
  return profile?.id ?? null;
}

/** Another link or profile already using this slug in any case. */
export const findLinkSlugClash = (slug: string, exceptId?: string) =>
  db.link.findFirst({
    where: { ...insensitive(slug), NOT: exceptId ? { id: exceptId } : undefined },
  });

export const findProfileSlugClash = (slug: string, exceptId?: string) =>
  db.profile.findFirst({
    where: { ...insensitive(slug), NOT: exceptId ? { id: exceptId } : undefined },
  });
