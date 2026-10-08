import { parseRoles, roleInfo } from "~/lib/permissions";

/** Chips for a user's extra roles (not the base "user") and a ban. */
export default function RoleChips({
  user,
}: {
  user: {
    role?: string | null;
    banned?: boolean | null;
    banExpires?: Date | null;
  };
}) {
  const extra = parseRoles(user.role).filter((role) => role !== "user");

  return (
    <>
      {extra.map((role) => (
        <span
          key={role}
          className="display bg-lime text-lime-ink rounded-full px-2 pt-0.5 text-sm"
        >
          {roleInfo[role].label}
        </span>
      ))}
      {isBanned(user) && (
        <span className="display bg-danger text-lime-ink rounded-full px-2 pt-0.5 text-sm">
          Banned
        </span>
      )}
    </>
  );
}

/** Bans past their expiry are only cleared on the next sign-in, so check the date. */
export const isBanned = (user: {
  banned?: boolean | null;
  banExpires?: Date | null;
}) => !!user.banned && (!user.banExpires || user.banExpires > new Date());
