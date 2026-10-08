"use client";

import { IconExternalLink, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import CopyButton from "~/components/CopyButton";
import Empty from "~/components/Empty";
import { Button } from "~/components/ui/button";
import { shareUrl } from "~/lib/domains";
import { formatNumber, plural } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";
import CreateProfileDialog from "./CreateProfileDialog";

/** /profiles: every link-in-bio page the user owns. */
export default function ProfilesList() {
  const [shareDomain] = useShareDomain();
  const profiles = api.profile.getProfiles.useQuery();
  const [creating, setCreating] = useState(false);
  const all = profiles.data?.profiles ?? [];

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[60px] leading-[1.15] sm:text-[96px]">
          Profiles
        </h1>
        <Button size="lg" onClick={() => setCreating(true)}>
          <IconPlus /> New profile
        </Button>
      </header>

      {all.length === 0 && !profiles.isPending ? (
        <Empty title="No profiles yet">
          A profile is a page of buttons at {shareDomain.host}/p/you.
        </Empty>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {all.map((profile) => {
            const url = shareUrl(shareDomain, `p/${profile.slug}`);
            return (
              <article
                key={profile.id}
                className="bg-panel flex flex-col rounded-2xl p-5"
              >
                <Link
                  href={`/profiles/${profile.id}`}
                  className="display truncate-display hover:text-lime text-[44px] leading-none"
                >
                  {profile.name}
                </Link>
                {profile.altName && (
                  <p className="text-muted mt-1 truncate text-sm">
                    {profile.altName}
                  </p>
                )}
                {profile.disabledAt && (
                  <p className="text-danger mt-1 text-sm">
                    Turned off by a moderator
                    {profile.disabledReason && `: ${profile.disabledReason}`}
                  </p>
                )}
                <div className="text-lime mt-2 flex items-center gap-1">
                  <span className="truncate">
                    {shareDomain.host}/p/{profile.slug}
                  </span>
                  <CopyButton value={url} className="text-muted" />
                </div>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                  <p className="text-muted text-sm">
                    <span className="display text-ink mr-1.5 text-[34px]">
                      {formatNumber(profile._count.clicks)}
                    </span>
                    views
                    {!!profile.bots && ` (+ ${plural(profile.bots, "bot")})`} ·{" "}
                    {plural(profile.profileLinks.length, "button")}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={url} target="_blank" rel="noreferrer">
                        <IconExternalLink /> View
                      </a>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/profiles/${profile.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {creating && <CreateProfileDialog onClose={() => setCreating(false)} />}
    </>
  );
}
