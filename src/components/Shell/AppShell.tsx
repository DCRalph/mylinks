"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Brand from "~/components/Brand";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import { can, isStaff } from "~/lib/permissions";
import { cn, reloadTo } from "~/lib/utils";
import ShareDomainPicker from "./ShareDomainPicker";
import UserMenu from "./UserMenu";

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  /** Comma-separated roles, see src/lib/permissions.ts. */
  role?: string | null;
};

const NAV: { href: string; label: string; show?: (u: ShellUser) => boolean }[] =
  [
    { href: "/dashboard", label: "Links" },
    { href: "/profiles", label: "Profiles" },
    { href: "/bookmarks", label: "Bookmarks" },
    {
      href: "/pixels",
      label: "Pixels",
      show: (u) => can(u, { pixel: ["use"] }),
    },
    { href: "/admin", label: "Admin", show: isStaff },
  ];

/** Top bar and page frame for every signed-in screen. */
export default function AppShell({
  user,
  impersonating,
  children,
}: {
  user: ShellUser;
  /** An admin is viewing the app as `user`. */
  impersonating: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.show?.(user) ?? true);

  const navLink = (item: (typeof NAV)[number]) => {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "display shrink-0 border-b-[3px] pb-0.5 text-base transition-colors sm:text-lg",
          active
            ? "border-lime text-ink"
            : "border-transparent text-muted hover:text-ink",
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {impersonating && <ImpersonationBar user={user} />}
      <header className="sticky top-0 z-40 bg-bg">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-8 px-5 sm:px-8">
          <Brand href="/dashboard" />
          <nav className="hidden items-center gap-6 md:flex">
            {items.map(navLink)}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ShareDomainPicker />
            <UserMenu user={user} />
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-5 pb-3 sm:gap-5 md:hidden">
          {items.map(navLink)}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-4 pb-24 sm:px-8">
        {children}
      </main>
    </div>
  );
}

/** Shown while an admin views the app as someone else. */
function ImpersonationBar({ user }: { user: ShellUser }) {
  const stop = async () => {
    await authClient.admin.stopImpersonating();
    reloadTo(`/admin/users/${user.id}`);
  };

  return (
    <div className="bg-lime text-lime-ink">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-2 sm:px-8">
        <p className="min-w-0 truncate text-sm font-semibold">
          Viewing as {user.name} ({user.email})
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="bg-lime-ink text-lime hover:bg-lime-ink/85 ml-auto h-8"
          onClick={stop}
        >
          Stop viewing
        </Button>
      </div>
    </div>
  );
}
