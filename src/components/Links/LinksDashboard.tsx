"use client";

import { IconArrowUpRight, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import Empty from "~/components/Empty";
import Growth from "~/components/Growth";
import { Input } from "~/components/ui/input";
import { formatNumber, growth } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import LinkDialog from "./LinkDialog";
import LinkTicket, { type TicketLink } from "./LinkTicket";
import ShortenForm from "./ShortenForm";

type Sort = "newest" | "clicks";

/** The signed-in home page: weekly clicks, the shorten bar, every link. */
export default function LinksDashboard() {
  const [shareDomain] = useShareDomain();
  const links = api.link.getMyLinks.useQuery();
  const stats = api.link.getStats.useQuery();
  const profiles = api.profile.getProfiles.useQuery();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [editing, setEditing] = useState<TicketLink | null>(null);

  const all = links.data?.links ?? [];
  const top = all.reduce<TicketLink | null>(
    (best, link) =>
      link._count.clicks > (best?._count.clicks ?? 0) ? link : best,
    null,
  );

  const q = query.trim().toLowerCase();
  const shown = all
    .filter(
      (link) =>
        !q ||
        link.name.toLowerCase().includes(q) ||
        link.slug.toLowerCase().includes(q) ||
        link.url.toLowerCase().includes(q),
    )
    .sort((a, b) =>
      sort === "clicks" ? b._count.clicks - a._count.clicks : 0,
    );

  const thisWeek = stats.data?.thisWeek ?? 0;
  const topProfiles = [...(profiles.data?.profiles ?? [])]
    .sort((a, b) => b._count.clicks - a._count.clicks)
    .slice(0, 2);

  return (
    <>
      <section className="grid items-end gap-6 pb-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]">
        <div>
          <p className="display text-[88px] leading-none sm:text-[112px]">
            {formatNumber(thisWeek)}
          </p>
          <p className="mt-3 flex items-center gap-3 text-muted">
            {thisWeek === 1 ? "click" : "clicks"} this week
            <Growth value={growth(thisWeek, stats.data?.lastWeek ?? 0)} />
          </p>
        </div>
        <ShortenForm />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="display text-[32px]">
            All links <span className="text-faint">{all.length}</span>
          </h2>
          {all.length > 0 && (
            <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
              <label className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
                <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
                <Input
                  className="h-10 pl-10"
                  placeholder="Search links"
                  aria-label="Search links"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="flex rounded-xl border-[1.5px] border-line p-0.5">
                {(["newest", "clicks"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSort(option)}
                    className={cn(
                      "display h-8 cursor-pointer rounded-lg px-3 text-base",
                      sort === option
                        ? "bg-ink text-bg"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    {option === "newest" ? "Newest" : "Top"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {links.isPending ? (
          <TicketSkeletons />
        ) : shown.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((link) => (
              <LinkTicket
                key={link.id}
                link={link}
                hot={link.id === top?.id}
                onEdit={() => setEditing(link)}
              />
            ))}
          </div>
        ) : all.length > 0 ? (
          <Empty title="No matches">Nothing matches “{query}”.</Empty>
        ) : (
          <Empty title="No links yet">
            Paste a URL above to make your first one.
          </Empty>
        )}
      </section>

      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-[32px]">Profiles</h2>
          <Link
            href="/profiles"
            className="display flex items-center gap-1 text-lg text-muted hover:text-ink"
          >
            All profiles <IconArrowUpRight className="size-5" />
          </Link>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {topProfiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/profiles/${profile.id}`}
              className="flex items-center gap-4 rounded-2xl border-[1.5px] border-line px-5 py-4 hover:border-faint"
            >
              <div className="min-w-0">
                <p className="display truncate-display text-[28px]">{profile.name}</p>
                <p className="truncate text-sm text-lime">
                  {shareDomain.host}/p/{profile.slug}
                </p>
              </div>
              <p className="ml-auto text-right text-[13px] text-muted">
                <span className="display block text-[30px] text-ink">
                  {formatNumber(profile._count.clicks)}
                </span>
                views
              </p>
            </Link>
          ))}
          {topProfiles.length < 2 && (
            <Link
              href="/profiles"
              className="grid place-items-center rounded-2xl border-[1.5px] border-dashed border-line px-5 py-6 text-muted hover:border-faint hover:text-ink"
            >
              <span className="display text-2xl">
                {topProfiles.length === 0
                  ? "Make a link-in-bio page"
                  : "New profile"}
              </span>
            </Link>
          )}
        </div>
      </section>

      {editing && (
        <LinkDialog
          key={editing.id}
          link={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function TicketSkeletons() {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[176px] rounded-2xl bg-panel" />
      ))}
    </div>
  );
}
