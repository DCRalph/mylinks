"use client";

import { IconChartBar, IconPencil } from "@tabler/icons-react";
import Link from "next/link";

import CopyButton from "~/components/CopyButton";
import { Button } from "~/components/ui/button";
import { shareUrl } from "~/lib/domains";
import {
  displayUrl,
  formatNumber,
  plural,
  ticketTextSize,
} from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";

export type TicketLink = {
  id: string;
  name: string;
  slug: string;
  url: string;
  /** People only; bots are counted separately. */
  _count: { clicks: number };
  bots?: number;
  disabledAt?: Date | null;
  disabledReason?: string | null;
};

/** A short link as a big ticket. `hot` paints it lime (the top performer). */
export default function LinkTicket({
  link,
  hot = false,
  onEdit,
}: {
  link: TicketLink;
  hot?: boolean;
  /** Omit for a read-only ticket. */
  onEdit?: () => void;
}) {
  const [shareDomain] = useShareDomain();
  const short = `${shareDomain.host}/${link.slug}`;

  return (
    <article
      className={cn(
        "flex min-h-[176px] min-w-0 flex-col rounded-2xl p-5",
        hot ? "bg-lime text-lime-ink" : "bg-panel",
      )}
    >
      <a
        href={shareUrl(shareDomain, link.slug)}
        target="_blank"
        rel="noreferrer"
        title={short}
        className={cn(
          "display truncate-display hover:underline",
          ticketTextSize(short),
        )}
      >
        {short}
      </a>
      <p className="mt-1.5 truncate font-semibold">{link.name}</p>
      <p
        title={link.url}
        className={cn(
          "truncate text-[13px]",
          hot ? "text-lime-ink/70" : "text-muted",
        )}
      >
        {displayUrl(link.url)}
      </p>
      {link.disabledAt && (
        <p className="mt-2 text-[13px] text-danger">
          Turned off by a moderator
          {link.disabledReason && `: ${link.disabledReason}`}
        </p>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <Link
          href={`/dashboard/links/${link.id}`}
          title="See stats"
          className="group leading-none"
        >
          <span className="display text-[40px] group-hover:underline">
            {formatNumber(link._count.clicks)}
            <span className="ml-1.5 text-base">
              {link._count.clicks === 1 ? "click" : "clicks"}
            </span>
          </span>
          {!!link.bots && (
            <span
              className={cn(
                "block text-xs",
                hot ? "text-lime-ink/70" : "text-faint",
              )}
            >
              + {plural(link.bots, "bot")}
            </span>
          )}
        </Link>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-current hover:bg-transparent"
            asChild
          >
            <Link
              href={`/dashboard/links/${link.id}`}
              aria-label="Link stats"
              title="Link stats"
            >
              <IconChartBar />
            </Link>
          </Button>
          <CopyButton value={shareUrl(shareDomain, link.slug)} />
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit link"
              title="Edit link"
              className="text-current hover:bg-transparent"
              onClick={onEdit}
            >
              <IconPencil />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
