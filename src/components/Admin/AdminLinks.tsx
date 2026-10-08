"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";

import { shareUrl } from "~/lib/domains";
import { displayUrl, formatNumber, formatRelative, plural } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Actions, OffChip, Toolbar, type ListQuery } from "./Moderation";

/** /admin/links: every short link, to turn off or delete. */
export default function AdminLinks() {
  const [shareDomain] = useShareDomain();
  const [query, setQuery] = useState<ListQuery>({
    search: "",
    filter: "all",
    sort: "newest",
  });
  const search = useDeferredValue(query.search.trim());
  const links = api.moderation.links.useQuery(
    { ...query, search },
    { placeholderData: keepPreviousData },
  );
  const utils = api.useUtils();
  const options = {
    onSuccess: () => utils.moderation.links.invalidate(),
    onError: (error: { message: string }) => toast.error(error.message),
  };
  const setDisabled = api.moderation.setLinkDisabled.useMutation(options);
  const remove = api.moderation.deleteLink.useMutation(options);

  const list = links.data ?? [];

  return (
    <>
      <Toolbar
        label="Search slug, URL or owner"
        query={query}
        onChange={setQuery}
      />
      {list.length === 0 ? (
        <p className="text-muted py-14 text-center">
          {links.isPending ? "Loading…" : "No links match."}
        </p>
      ) : (
        <ul
          className={cn(
            "bg-panel divide-line divide-y rounded-2xl px-5",
            links.isPlaceholderData && "opacity-60",
          )}
        >
          {list.map((link) => {
            const short = `${shareDomain.host}/${link.slug}`;
            return (
              <li
                key={link.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3.5"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <p className="flex items-center gap-2">
                    <a
                      href={shareUrl(shareDomain, link.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "display truncate-display text-2xl hover:underline",
                        link.disabledAt && "text-faint",
                      )}
                    >
                      {short}
                    </a>
                    {link.disabledAt && <OffChip reason={link.disabledReason} />}
                  </p>
                  <p className="text-muted truncate text-[13px]">
                    <Link
                      href={`/admin/users/${link.user.id}`}
                      className="text-ink hover:underline"
                    >
                      @{link.user.username ?? link.user.name}
                    </Link>{" "}
                    · {displayUrl(link.url)} · {formatRelative(link.createdAt)}
                  </p>
                  {link.disabledReason && (
                    <p className="text-danger text-[13px]">
                      {link.disabledReason}
                    </p>
                  )}
                </div>
                <Link
                  href={`/dashboard/links/${link.id}`}
                  className="w-28 text-right hover:underline"
                >
                  <span className="display block text-[26px] leading-none">
                    {formatNumber(link._count.clicks)}
                  </span>
                  <span className="text-faint text-xs">
                    {link.bots ? `+ ${plural(link.bots, "bot")}` : "clicks"}
                  </span>
                </Link>
                <Actions
                  what="link"
                  name={short}
                  disabled={!!link.disabledAt}
                  pending={setDisabled.isPending || remove.isPending}
                  onTurnOff={(reason) =>
                    setDisabled.mutate({ id: link.id, reason })
                  }
                  onTurnOn={() => setDisabled.mutate({ id: link.id, reason: null })}
                  onDelete={() => remove.mutate({ id: link.id })}
                />
              </li>
            );
          })}
        </ul>
      )}
      {list.length === 100 && (
        <p className="text-muted mt-4 text-center text-sm">
          Showing the first 100. Search to narrow it down.
        </p>
      )}
    </>
  );
}
