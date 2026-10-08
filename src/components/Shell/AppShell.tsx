"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Brand from "~/components/Brand";
import { cn } from "~/lib/utils";
import ShareDomainPicker from "./ShareDomainPicker";
import UserMenu from "./UserMenu";

export type ShellUser = {
  name: string;
  email: string;
  image?: string | null;
  admin: boolean;
  spyPixel: boolean;
};

const NAV: { href: string; label: string; show?: (u: ShellUser) => boolean }[] =
  [
    { href: "/dashboard", label: "Links" },
    { href: "/profiles", label: "Profiles" },
    { href: "/bookmarks", label: "Bookmarks" },
    { href: "/pixels", label: "Pixels", show: (u) => u.spyPixel || u.admin },
    { href: "/admin", label: "Admin", show: (u) => u.admin },
  ];

/** Top bar and page frame for every signed-in screen. */
export default function AppShell({
  user,
  children,
}: {
  user: ShellUser;
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
