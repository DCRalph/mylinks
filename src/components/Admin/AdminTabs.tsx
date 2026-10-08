"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";
import { adminTabs } from "./tabs";

/** The row of tabs under the Admin heading, limited to what `role` allows. */
export default function AdminTabs({ role }: { role?: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="mt-3 mb-8 flex flex-wrap gap-1.5">
      {adminTabs({ role }).map((tab) => {
        const active =
          tab.href === "/admin"
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "display rounded-[10px] px-3.5 pt-2 pb-1.5 text-lg transition-colors",
              active ? "bg-ink text-bg" : "bg-panel text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
