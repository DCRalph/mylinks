"use client";

import { IconSearch } from "@tabler/icons-react";
import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatRelative } from "~/lib/format";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const fullDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** /admin/audit: who did what in the console, newest first. */
export default function AdminAudit() {
  const [query, setQuery] = useState("");
  const search = useDeferredValue(query.trim());
  const log = api.admin.auditLog.useInfiniteQuery(
    { search },
    {
      getNextPageParam: (page) => page.nextCursor,
      placeholderData: keepPreviousData,
    },
  );
  const entries = log.data?.pages.flatMap((page) => page.entries) ?? [];

  return (
    <>
      <label className="relative mb-4 block max-w-sm">
        <IconSearch className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          className="h-10 pl-10"
          placeholder="Search the log"
          aria-label="Search the log"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {entries.length === 0 ? (
        <p className="text-muted py-14 text-center">
          {log.isPending
            ? "Loading…"
            : search
              ? "Nothing matches."
              : "Nothing yet. Bans, role changes and other admin actions show up here."}
        </p>
      ) : (
        <ul
          className={cn(
            "bg-panel divide-line divide-y rounded-2xl px-5",
            log.isPlaceholderData && "opacity-60",
          )}
        >
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="grid gap-x-5 gap-y-0.5 py-3 sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-baseline"
            >
              <time
                dateTime={entry.createdAt.toISOString()}
                title={fullDate.format(entry.createdAt)}
                className="text-muted text-sm"
              >
                {formatRelative(entry.createdAt)}
              </time>
              <p className="min-w-0 break-words">
                {entry.actor ? (
                  <Link
                    href={`/admin/users/${entry.actor.id}`}
                    className="font-semibold hover:underline"
                  >
                    {entry.actor.name}
                  </Link>
                ) : (
                  <span className="text-muted font-semibold">Deleted user</span>
                )}{" "}
                <span className="text-muted">·</span> {entry.summary}
              </p>
              <span className="text-faint font-mono text-xs">
                {entry.action}
              </span>
            </li>
          ))}
        </ul>
      )}

      {log.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            disabled={log.isFetchingNextPage}
            onClick={() => log.fetchNextPage()}
          >
            {log.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
