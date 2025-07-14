import { type Profile, type ProfileLink } from "@prisma/client";
import {
  IconExternalLink,
  IconArrowUpRight,
} from "@tabler/icons-react";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";
import Image from "next/image";
import AnalyticsToggle from "./AnalyticsToggle";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function ProfilePage({
  profile,
}: {
  profile: Profile_ProjectLinks;
}) {
  const linkOrder = parseProfileLinkOrder({
    linkOrderS: profile.linkOrder,
    profileLinks: profile.profileLinks,
  });

  const orderedLinks = linkOrder
    .map((id) => {
      return profile.profileLinks.find((link) => link.id === id);
    })
    .filter((link): link is ProfileLink => link !== undefined);

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Decorative Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>

      {/* Analytics Toggle for Owner */}
      <AnalyticsToggle profile={profile} />

      {/* Profile Header */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-16 sm:px-8">
        <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="relative z-10">
            <h1 className="sora mb-4 text-4xl font-bold tracking-tight text-white">
              {profile.name}
            </h1>

            {profile.bio != null && (
              <p className="mt-4 text-lg text-zinc-300">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Links Section */}
      {orderedLinks.length > 0 && (
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 sm:px-8">
          <div className="grid grid-cols-1 gap-4">
            {orderedLinks.map((link) => (
              <ProfileLinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      )}

    </main>
  );
}

function ProfileLinkCard({ link }: { link: ProfileLink }) {
  const bgColor = link.bgColor ?? "#888888";
  const fgColor = link.fgColor ?? "#FFFFFF";
  const icon = link.iconUrl ? "/profileLinkIcons/" + link.iconUrl : undefined;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block transform transition-all hover:translate-y-[-2px]"
    >
      <div className="glass-card relative flex h-20 w-full cursor-pointer items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10">
        <div
          className="aspect-square h-full rounded-lg p-2"
          style={{
            background: `${bgColor}`,
            color: fgColor,
          }}
        >
          {icon && (
            <Image
              src={icon}
              alt={link.title}
              className="h-full w-full"
              width={48}
              height={48}
            />
          )}
          {!icon && <IconExternalLink className="h-full w-full" />}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <h4 className="text-lg font-medium text-white">{link.title}</h4>
          {link.description && (
            <p className="text-sm text-zinc-300">{link.description}</p>
          )}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all group-hover:bg-white/20 group-hover:text-white">
          <IconArrowUpRight size={16} />
        </div>
      </div>
    </a>
  );
}
