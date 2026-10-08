import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Every action a role can be allowed, by resource. This file is the whole
 * permission system: to add a capability, add an action here, grant it to
 * roles below, and check it with `can(user, { resource: ["action"] })`.
 * Never check role names directly.
 *
 * `user` and `session` come from better-auth's admin plugin, which enforces
 * them on its own endpoints (ban, set-role, impersonate, ...).
 */
export const statements = {
  ...defaultStatements,
  pixel: ["use"],
  link: ["moderate", "short-slug"],
  profile: ["moderate"],
  domain: ["manage"],
  platform: ["manage", "unlimited"],
  audit: ["read"],
  stats: ["read"],
} as const;

export const ac = createAccessControl(statements);

/**
 * Roles are bundles of permissions. A user can hold several, stored
 * comma-separated in User.role (e.g. "user,pixels").
 */
export const roles = {
  user: ac.newRole({}),
  pixels: ac.newRole({ pixel: ["use"] }),
  moderator: ac.newRole({
    user: ["list", "get", "ban"],
    session: ["list", "revoke"],
    link: ["moderate"],
    profile: ["moderate"],
    audit: ["read"],
    stats: ["read"],
  }),
  admin: ac.newRole({
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "impersonate",
      "delete",
      "set-password",
      "set-email",
      "get",
      "update",
    ],
    session: ["list", "revoke", "delete"],
    pixel: ["use"],
    link: ["moderate", "short-slug"],
    profile: ["moderate"],
    domain: ["manage"],
    platform: ["manage", "unlimited"],
    audit: ["read"],
    stats: ["read"],
  }),
};

export type RoleName = keyof typeof roles;

/** Shown in the admin console next to each role. */
export const roleInfo: Record<
  RoleName,
  { label: string; description: string }
> = {
  user: { label: "User", description: "Links, profiles and bookmarks." },
  pixels: { label: "Pixels", description: "Can create tracking pixels." },
  moderator: {
    label: "Moderator",
    description: "Can ban users and disable links or profiles.",
  },
  admin: {
    label: "Admin",
    description: "Everything, including domains, settings and roles.",
  },
};

type Statements = typeof statements;
export type Permissions = {
  [R in keyof Statements]?: Statements[R][number][];
};

const isRoleName = (name: string): name is RoleName => name in roles;

/** The roles in a User.role string, ignoring any that no longer exist. */
export const parseRoles = (role: string | null | undefined): RoleName[] =>
  (role ?? "user")
    .split(",")
    .map((name) => name.trim())
    .filter(isRoleName);

/**
 * Whether any of the user's roles allows `permissions`. Every listed action
 * is required, unless `any` is set, in which case one is enough.
 */
export function can(
  user: { role?: string | null } | null | undefined,
  permissions: Permissions,
  { any = false }: { any?: boolean } = {},
) {
  if (!user) return false;
  return parseRoles(user.role).some(
    (name) => roles[name].authorize(permissions, any ? "OR" : "AND").success,
  );
}

/**
 * Anything that unlocks a tab in the admin console. Holders are "staff":
 * only people who can assign roles may ban, sign out or delete them.
 */
export const ADMIN_CONSOLE: Permissions = {
  stats: ["read"],
  user: ["list"],
  link: ["moderate"],
  profile: ["moderate"],
  domain: ["manage"],
  platform: ["manage"],
  audit: ["read"],
};

export const isStaff = (user: { role?: string | null } | null | undefined) =>
  can(user, ADMIN_CONSOLE, { any: true });

/** Roles that make their holder staff. */
export const STAFF_ROLES = (Object.keys(roles) as RoleName[]).filter((role) =>
  isStaff({ role }),
);
