
import { type ProfileLink } from "@prisma/client"
import Image from "next/image";

export default function ProfileLinkElement({ link }: { link: ProfileLink }) {

  const color = link.color ?? "bg-zinc-700 text-white";
  const icon = link.iconUrl ? "/profileLinkIcons/" + link.iconUrl : "/profileLinkIcons/generic.png";

  return (
    <a className="h-20 w-full flex gap-4 transform transition md:hover:-translate-y-2 md:hover:-translate-x-2 gobold"
      href={link.url} target="_blank">

      <div className={color + " rounded-lg w-56 md:w-80 flex flex-col px-4 justify-center items-center"}>
        <p className="text-2xl">
          {link.title}
        </p>
        <p className="text-sm">
          {link.showenUrl}
        </p>
      </div>

      <div className="aspect-square flex justify-center items-center h-full rounded-lg bg-zinc-700 p-2">
        <Image
          src={icon}
          alt={link.title}
          width={1000}
          height={1000}
        />
      </div>
    </a>
  )
}