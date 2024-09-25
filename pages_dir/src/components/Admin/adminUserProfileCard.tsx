import { type Profile, type ProfileLink } from "@prisma/client";
import { IconChevronDown, IconChevronUp, IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { env } from "~/env";
import AdminUserProfileLinkCard from "./adminUserProfileLinkCard";

export default function AdminUserProfileCard({
  profile,
}: {
  profile: Profile & { profileLinks: ProfileLink[] };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid h-min grid-cols-12 rounded-lg border-2 border-zinc-600 bg-zinc-900 text-white shadow-lg">
      <div className="col-span-full lg:col-span-8 p-4">
        <p className="pb-4 text-3xl font-bold">{profile.name} </p>
        <Link
          className="flex items-center gap-2 text-lg font-bold underline break-all"
          href={`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
          target="_blank"
        >
          {env.NEXT_PUBLIC_SHORT_DOMAIN}/p/{profile.slug}
          <IconExternalLink />
        </Link>
        <p className="text-lg font-bold break-all">{profile.name}</p>
      </div>

      <div className="col-span-full lg:col-span-4 p-4">
        <div className="flex lg:justify-end">
          <button
            className={`${expanded ? "form_btn_green" : "form_btn_red"} flex items-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300`}
            onClick={() => {
              setExpanded(!expanded);
            }}
          >
            {expanded ? "Expanded" : "Collapsed"}
            {expanded ? <IconChevronDown /> : <IconChevronUp />}
          </button>
        </div>
      </div>


      {expanded && profile.profileLinks.length == 0 && (
        <div className="col-span-12 p-4 border-t border-zinc-600">
          <p className="text-center text-2xl font-bold">No links</p>
        </div>
      )}

      {expanded && profile.profileLinks.length != 0 && (
        <div className="col-span-12 flex flex-col gap-4 p-4 border-t border-zinc-600">
          {profile.profileLinks.map((link) => (
            <AdminUserProfileLinkCard key={link.id} profileLink={link} userID={profile.userId} />
          ))}
        </div>
      )}
    </div>
  );
}
