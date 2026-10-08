"use client";

import { IconChevronRight, IconKey, IconSearch } from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import GoogleIcon from "~/components/GoogleIcon";
import { Input } from "~/components/ui/input";
import { formatRelative, plural } from "~/lib/format";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import RoleChips from "./RoleChips";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "staff", label: "Staff" },
  { value: "banned", label: "Banned" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

/** /admin/users: everyone with an account, searchable and filterable. */
export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const search = useDeferredValue(query.trim());
  const users = api.admin.getUsers.useQuery(
    { search, filter },
    { placeholderData: keepPreviousData },
  );
  const list = users.data ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <label className="relative block w-full max-w-sm">
          <IconSearch className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            className="h-10 pl-10"
            placeholder="Search name, email or username"
            aria-label="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="border-line flex rounded-xl border-[1.5px] p-0.5">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "display h-8 cursor-pointer rounded-lg px-3 text-base",
                filter === option.value
                  ? "bg-ink text-bg"
                  : "text-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-muted py-14 text-center">
          {users.isPending ? "Loading…" : "Nobody matches."}
        </p>
      ) : (
        <ul
          className={cn("grid gap-2", users.isPlaceholderData && "opacity-60")}
        >
          {list.map((user) => (
            <li key={user.id}>
              <Link
                href={`/admin/users/${user.id}`}
                className="bg-panel hover:bg-raised flex items-center gap-4 rounded-2xl p-4"
              >
                <span className="display bg-raised grid size-11 shrink-0 place-items-center rounded-full text-xl">
                  {user.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{user.name}</span>
                    {user.username && (
                      <span className="text-muted text-sm">
                        @{user.username}
                      </span>
                    )}
                    <RoleChips user={user} />
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
      )}
      {list.length === 200 && (
        <p className="text-muted mt-4 text-center text-sm">
          Showing the newest 200. Search to find someone else.
        </p>
      )}
    </>
  );
}
