import { IconArrowUpRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";
import { iconSrc } from "~/utils/profileLinkIcons";

export type ViewLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  bgColor: string | null;
  fgColor: string | null;
};

/**
 * A public link-in-bio page. Rendered at /p/<slug> and as the live preview in
 * the profile editor (`compact` shrinks the type to fit the phone frame).
 */
export default function ProfileView({
  name,
  bio,
  links,
  compact = false,
}: {
  name: string;
  bio: string | null;
  links: ViewLink[];
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-full w-full max-w-md flex-col",
        compact ? "px-5 pt-12 pb-6" : "px-5 pt-16 pb-8 sm:pt-24",
      )}
    >
      <h1
        className={cn(
          "display leading-[1.15] break-words",
          compact ? "text-[56px]" : "text-[76px] sm:text-[96px]",
        )}
      >
        {name || "Your name"}
      </h1>
      {bio && (
        <p className="mt-4 whitespace-pre-line text-[15px] text-muted">{bio}</p>
      )}

      <div className="mt-7 grid gap-2.5">
        {links.map((link) => (
          <ProfileButton key={link.id} link={link} />
        ))}
      </div>

      <Link
        href="/"
        className="mt-auto pt-12 text-center text-xs text-muted hover:text-ink"
      >
        Made with link2it
      </Link>
    </div>
  );
}

/** One full-width profile button in the link's own colours. */
export function ProfileButton({ link }: { link: ViewLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-16 items-center gap-3.5 rounded-2xl px-4 ring-1 ring-white/10 ring-inset transition-transform hover:-translate-y-0.5"
      style={{
        background: link.bgColor ?? "var(--color-raised)",
        color: link.fgColor ?? "var(--color-ink)",
      }}
    >
      {link.iconUrl && (
        <Image
          src={iconSrc(link.iconUrl)}
          alt=""
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-lg object-contain"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="display block truncate-display text-[26px]">{link.title}</span>
        {link.description && (
          <span className="block truncate text-xs opacity-75">
            {link.description}
          </span>
        )}
      </span>
      <IconArrowUpRight className="size-6 shrink-0" />
    </a>
  );
}
