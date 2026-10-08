import { IconPencil } from "@tabler/icons-react";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import ProfileView from "~/components/Profiles/ProfileView";
import { canManage } from "~/server/api/access";
import { getSession } from "~/server/auth";
import { api } from "~/trpc/server";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

// Shared by generateMetadata and the page so the visit is recorded once.
const getProfile = cache((slug: string) =>
  api.profile.getPublicProfile({ slug }),
);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).slug);
  if (!profile) return { title: "Not found" };
  return {
    title: profile.name,
    description: profile.bio ?? `${profile.name} on link2it`,
  };
}

/** Public link-in-bio page. Works on every configured domain. */
export default async function Page({ params }: Props) {
  const profile = await getProfile((await params).slug);
  if (!profile) notFound();

  const session = await getSession();
  const canEdit =
    !!session && canManage("profile", profile.userId, session.user);
  const byId = new Map(profile.profileLinks.map((link) => [link.id, link]));
  const links = parseProfileLinkOrder({
    linkOrderS: profile.linkOrder,
    profileLinks: profile.profileLinks,
  }).flatMap((id) => byId.get(id) ?? []);

  return (
    <main className="min-h-dvh">
      <div className={canEdit ? "flex min-h-dvh pb-16" : "flex min-h-dvh"}>
        <ProfileView name={profile.name} bio={profile.bio} links={links} />
      </div>
      {canEdit && (
        <Link
          href={`/profiles/${profile.id}`}
          className="display fixed right-5 bottom-5 flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-lg text-lime-ink"
        >
          <IconPencil className="size-5" /> Edit profile
        </Link>
      )}
    </main>
  );
}
