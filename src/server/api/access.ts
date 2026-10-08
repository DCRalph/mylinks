import { can } from "~/lib/permissions";

/** Owners manage their own links and profiles; moderators manage everyone's. */
export const canManage = (
  resource: "link" | "profile",
  ownerId: string,
  user: { id: string; role?: string | null },
) => ownerId === user.id || can(user, { [resource]: ["moderate"] });
