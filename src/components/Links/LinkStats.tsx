"use client";

import { IconArrowLeft, IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import ClickAnalytics, { type Range } from "~/components/ClickAnalytics";
import CopyButton from "~/components/CopyButton";
import Empty from "~/components/Empty";
import { Button } from "~/components/ui/button";
import { shareUrl } from "~/lib/domains";
import { displayUrl, formatRelative } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import LinkDialog from "./LinkDialog";

type Click = RouterOutputs["link"]["getClicks"]["clicks"][number];

const fullDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** /dashboard/links/[id]: one link's analytics and every click. */
export default function LinkStats({ id }: { id: string }) {
  const [shareDomain] = useShareDomain();
  const [days, setDays] = useState<Range>(7);
  const [editing, setEditing] = useState(false);
  const link = api.link.getLink.useQuery({ id });
  const analytics = api.link.getAnalytics.useQuery({ id, days });
  const clicks = api.link.getClicks.useInfiniteQuery(
    { id },
    { getNextPageParam: (page) => page.nextCursor },
  );

  if (link.error) return <Empty title="Link not found" className="mt-10" />;
  const data = link.data;
  if (!data) return <p className="text-muted py-20 text-center">Loading…</p>;

  const short = `${shareDomain.host}/${data.slug}`;
  const list = clicks.data?.pages.flatMap((page) => page.clicks) ?? [];

  return (
    <>
      <Link
        href="/dashboard"
        className="display text-muted hover:text-ink inline-flex items-center gap-1.5 text-lg"
      >
        <IconArrowLeft className="size-5" /> Links
      </Link>

      <header className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display truncate-display text-[48px] sm:text-[72px]">
            {short}
          </h1>
          <p className="mt-1 font-semibold">{data.name}</p>
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink block truncate text-sm"
          >
            {displayUrl(data.url)}
          </a>
          {data.disabledAt && (
            <p className="text-danger mt-2 text-sm">
              Turned off by a moderator
              {data.disabledReason && `: ${data.disabledReason}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <CopyButton
            value={shareUrl(shareDomain, data.slug)}
            className="border-[1.5px]"
          />
          <Button variant="outline" onClick={() => setEditing(true)}>
            <IconPencil /> Edit
          </Button>
        </div>
      </header>

      <ClickAnalytics
        noun="clicks"
        days={days}
        onDaysChange={setDays}
        data={analytics.data}
      />

      <section className="bg-panel mt-3.5 rounded-2xl p-5">
        <h2 className="display mb-3 text-[28px]">Clicks</h2>
        {list.length === 0 ? (
          <p className="text-muted py-6 text-center">
            {clicks.isPending ? "Loading…" : "No clicks yet."}
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {list.map((click) => (
              <ClickRow key={click.id} click={click} />
            ))}
          </ul>
        )}
        {clicks.hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              disabled={clicks.isFetchingNextPage}
              onClick={() => clicks.fetchNextPage()}
            >
              {clicks.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </section>

      {editing && (
        <LinkDialog
          key={data.id}
          link={data}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

function ClickRow({ click }: { click: Click }) {
  const client =
    [click.client, click.os].filter(Boolean).join(" on ") || "Unknown client";

  return (
    <li
      title={click.userAgent ?? undefined}
      className={cn(
        "grid gap-x-5 gap-y-0.5 py-2.5 text-sm sm:grid-cols-[140px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]",
        click.isBot && "text-faint",
      )}
    >
      <time
        dateTime={click.createdAt.toISOString()}
        title={fullDate.format(click.createdAt)}
        className={click.isBot ? undefined : "text-muted"}
      >
        {formatRelative(click.createdAt)}
      </time>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate">{client}</span>
        {click.isBot && (
          <span className="display bg-raised text-muted shrink-0 rounded-full px-2 pt-0.5 text-xs">
            Bot
          </span>
        )}
        {!click.isBot && click.device && click.device !== "Unknown" && (
          <span className="text-muted shrink-0">· {click.device}</span>
        )}
      </span>
      <span className="truncate" title={click.referer ?? undefined}>
        {click.refererHost ?? "Direct"}
      </span>
      <span className="text-muted truncate">
        {[click.country && regionNames.of(click.country), click.host]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </li>
  );
}
