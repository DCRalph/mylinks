import { type ProfileLink } from "@prisma/client";
import Image from "next/image";
import { defualtIcon } from "~/utils/profileLinkIcons";

export default function ProfileLinkElement({ link }: { link: ProfileLink }) {
  const bgColor = link.bgColor ?? "#888888";
  const fgColor = link.fgColor ?? "#FFFFFF";
  const icon = link.iconUrl
    ? "/profileLinkIcons/" + link.iconUrl
    : "/profileLinkIcons/" + defualtIcon.icon;

  return (
    <a
      className="gobold flex h-20 transform gap-4 transition md:hover:-translate-x-2 md:hover:-translate-y-2"
      href={link.url}
      target="_blank"
    >
      <div
        className="flex w-56 flex-col items-center justify-center rounded-lg px-4 md:w-80"
        style={{ background: bgColor, color: fgColor }}
      >
        <p className="text-2xl">{link.title}</p>
        <p className="text-sm">{link.description}</p>
      </div>

      <div className="flex aspect-square h-full items-center justify-center rounded-lg bg-zinc-700 p-2">
        <Image src={icon} alt={link.title} width={1000} height={1000} />
      </div>
    </a>
  );
}
