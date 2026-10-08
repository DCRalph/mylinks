"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";

import { shareUrl } from "~/lib/domains";
import { formatNumber, formatRelative, plural } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Actions, OffChip, Toolbar, type ListQuery } from "./Moderation";

/** /admin/profiles: every link-in-bio page, to turn off or delete. */
export default function AdminProfiles() {
  const [shareDomain] = useShareDomain();
  const [query, setQuery] = useState<ListQuery>({
    search: "",
    filter: "all",
    sort: "newest",
  });
  const search = useDeferredValue(query.search.trim());
  const profiles = api.moderation.profiles.useQuery(
    { ...query, search },
    { placeholderData: keepPreviousData },
  );
  const utils = api.useUtils();
  const options = {
    onSuccess: () => utils.moderation.profiles.invalidate(),
    onError: (error: { message: string }) => toast.error(error.message),
  };
  const setDisabled = api.moderation.setProfileDisabled.useMutation(options);
  const remove = api.moderation.deleteProfile.useMutation(options);

  const list = profiles.data ?? [];

  return (
    <>
      <Toolbar
        label="Search name, slug or owner"
        query={query}
        onChange={setQuery}
      />
      {list.length === 0 ? (
        <p className="text-muted py-14 text-center">
          {profiles.isPending ? "Loading…" : "No profiles match."}
        </p>
      ) : (
        <ul
          className={cn(
            "bg-panel divide-line divide-y rounded-2xl px-5",
            profiles.isPlaceholderData && "opacity-60",
          )}
        >
          {list.map((profile) => {
            const path = `p/${profile.slug}`;
            return (
              <li
                key={profile.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3.5"
              >
                <div className="min-w-0 flex-1 basis-64">
                  <p className="flex items-center gap-2">
                    <a
                      href={shareUrl(shareDomain, path)}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "display truncate-display text-2xl hover:underline",
                        profile.disabledAt && "text-faint",
                      )}
                    >
                      {profile.name}
                    </a>
                    {profile.disabledAt && (
                      <OffChip reason={profile.disabledReason} />
                    )}
                  </p>
                  <p className="text-muted truncate text-[13px]">
                    <Link
                      href={`/admin/users/${profile.user.id}`}
                      className="text-ink hover:underline"
                    >
                      @{profile.user.username ?? profile.user.name}
                    </Link>{" "}
                    · {shareDomain.host}/{path} ·{" "}
                    {plural(profile._count.profileLinks, "button")} ·{" "}
                    {formatRelative(profile.createdAt)}
                  </p>
                  {profile.disabledReason && (
                    <p className="text-danger text-[13px]">
                      {profile.disabledReason}
                    </p>
                  )}
                </div>
                <div className="w-28 text-right">
                  <span className="display block text-[26px] leading-none">
                    {formatNumber(profile._count.clicks)}
                  </span>
                  <span className="text-faint text-xs">
                    {profile.bots
                      ? `+ ${plural(profile.bots, "bot")}`
                      : "views"}
                  </span>
                </div>
                <Actions
                  what="profile"
                  name={profile.name}
                  disabled={!!profile.disabledAt}
                  pending={setDisabled.isPending || remove.isPending}
                  onTurnOff={(reason) =>
                    setDisabled.mutate({ id: profile.id, reason })
                  }
                  onTurnOn={() =>
                    setDisabled.mutate({ id: profile.id, reason: null })
                  }
                  onDelete={() => remove.mutate({ id: profile.id })}
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
