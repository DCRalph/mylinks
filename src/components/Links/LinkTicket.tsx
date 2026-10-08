"use client";

import { IconPencil } from "@tabler/icons-react";

import CopyButton from "~/components/CopyButton";
import { Button } from "~/components/ui/button";
import { shareUrl } from "~/lib/domains";
import { displayUrl, formatNumber, ticketTextSize } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";

export type TicketLink = {
  id: string;
  name: string;
  slug: string;
  url: string;
  _count: { clicks: number };
};

/** A short link as a big ticket. `hot` paints it lime (the top performer). */
export default function LinkTicket({
  link,
  hot = false,
  onEdit,
}: {
  link: TicketLink;
  hot?: boolean;
  onEdit: () => void;
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
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <p className="display text-[40px]">
          {formatNumber(link._count.clicks)}
          <span className="ml-1.5 text-base">
            {link._count.clicks === 1 ? "click" : "clicks"}
          </span>
        </p>
        <div className="flex gap-2">
          <CopyButton value={shareUrl(shareDomain, link.slug)} />
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
        </div>
      </div>
    </article>
  );
}
