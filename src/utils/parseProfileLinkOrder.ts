import { z } from "zod";

import { type ProfileLink } from "~/generated/prisma/client";

const orderSchema = z.array(z.string());

/**
 * Display order for `profileLinks`. `linkOrderS` is the stored JSON array of
 * ids. Ids that aren't in `profileLinks` are dropped, and links missing from the
 * stored order (or a corrupt value) follow in creation order, so a link can
 * never silently disappear from a profile.
 */
export default function parseProfileLinkOrder({
  linkOrderS,
  profileLinks,
}: {
  linkOrderS: string;
  profileLinks: Pick<ProfileLink, "id">[];
}): string[] {
  let order: string[] = [];
  try {
    order = orderSchema.parse(JSON.parse(linkOrderS));
  } catch {
    // Corrupt or legacy value; rebuild from the links themselves.
  }

  const ids = profileLinks.map((link) => link.id);
  const known = order.filter((id) => ids.includes(id));
  const missing = ids.filter((id) => !known.includes(id));

  return [...known, ...missing];
}
