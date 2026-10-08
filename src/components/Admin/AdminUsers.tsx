"use client";

import { IconChevronRight, IconKey, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import GoogleIcon from "~/components/GoogleIcon";
import { Input } from "~/components/ui/input";
import { formatNumber, formatRelative, plural } from "~/lib/format";
import { api } from "~/trpc/react";

/** /admin: everyone with an account, searchable. */
export default function AdminUsers() {
  const users = api.admin.getUsers.useQuery();
  const [query, setQuery] = useState("");

  const all = users.data ?? [];
  const q = query.trim().toLowerCase();
  const shown = all.filter(
    (user) =>
      !q ||
      [user.name, user.email, user.username ?? ""].some((field) =>
        field.toLowerCase().includes(q),
      ),
  );
  const totals = all.reduce(
    (sum, user) => ({
      links: sum.links + user._count.Links,
      profiles: sum.profiles + user._count.Profiles,
    }),
    { links: 0, profiles: 0 },
  );

  return (
    <>
      <h1 className="display mb-6 text-[60px] leading-[1.15] sm:text-[96px]">
        Admin
      </h1>

      <div className="mb-8 grid grid-cols-3 gap-3.5">
        {[
          { label: "Users", value: all.length },
          { label: "Links", value: totals.links },
          { label: "Profiles", value: totals.profiles },
        ].map((stat) => (
          <div key={stat.label} className="bg-panel rounded-2xl p-4 sm:p-5">
            <p className="display text-[40px] leading-none sm:text-[56px]">
              {formatNumber(stat.value)}
            </p>
            <p className="text-muted mt-1 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <label className="relative mb-4 block max-w-sm">
        <IconSearch className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          className="h-10 pl-10"
          placeholder="Search name, email or username"
          aria-label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <ul className="grid gap-2">
        {shown.map((user) => (
          <li key={user.id}>
            <Link
              href={`/admin/user/${user.id}`}
              className="bg-panel hover:bg-raised flex items-center gap-4 rounded-2xl p-4"
            >
              <span className="display bg-raised grid size-11 shrink-0 place-items-center rounded-full text-xl">
                {user.name.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{user.name}</span>
                  {user.username && (
                    <span className="text-muted text-sm">@{user.username}</span>
                  )}
                  {user.admin && <Chip>Admin</Chip>}
                  {user.spyPixel && <Chip>Pixels</Chip>}
                </p>
                <p className="text-muted truncate text-sm">{user.email}</p>
              </div>
              <div className="text-muted hidden items-center gap-2 sm:flex">
                {user.accounts.some((a) => a.providerId === "google") && (
                  <GoogleIcon className="size-4" />
                )}
                {user.accounts.some((a) => a.providerId === "credential") && (
                  <IconKey className="size-4" />
                )}
              </div>
              <p className="text-muted hidden w-40 text-right text-sm md:block">
                {plural(user._count.Links, "link")} ·{" "}
                {plural(user._count.Profiles, "profile")}
                <br />
                joined {formatRelative(user.createdAt)}
              </p>
              <IconChevronRight className="text-faint size-5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="display bg-lime text-lime-ink rounded-full px-2 pt-0.5 text-sm">
      {children}
    </span>
  );
}
