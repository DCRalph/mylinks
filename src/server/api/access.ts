/** Owners manage their own links and profiles; admins manage everyone's. */
export const canManage = (
  ownerId: string,
  user: { id: string; admin: boolean },
) => ownerId === user.id || user.admin;
