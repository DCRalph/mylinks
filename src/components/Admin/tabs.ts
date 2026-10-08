import { can, type Permissions } from "~/lib/permissions";

/**
 * Admin console tabs and what each needs. Keep every permission here inside
 * ADMIN_CONSOLE (src/lib/permissions.ts), which decides who sees Admin at all.
 */
const TABS = [
  { href: "/admin", label: "Overview", permissions: { stats: ["read"] } },
  { href: "/admin/users", label: "Users", permissions: { user: ["list"] } },
  {
    href: "/admin/audit",
    label: "Audit log",
    permissions: { audit: ["read"] },
  },
] satisfies { href: string; label: string; permissions: Permissions }[];

export const adminTabs = (user: { role?: string | null }) =>
  TABS.filter((tab) => can(user, tab.permissions));
