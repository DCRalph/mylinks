import { type ProfileLink } from "@prisma/client";
import { defualtIcon } from "~/utils/profileLinkIcons";
import Image from "next/image";

export default function AdminUserProfileLinkCard({
  profileLink,
}: {
  profileLink: ProfileLink;
}) {
  const icon = profileLink.iconUrl
    ? "/profileLinkIcons/" + profileLink.iconUrl
    : "/profileLinkIcons/" + defualtIcon.icon;

  return (
    <div className="grid grid-cols-12 gap-4 rounded-lg border-2 border-zinc-600 bg-zinc-900 p-4 text-white shadow-lg">
      <div className="col-span-8">
        <p className="text-3xl font-bold">{profileLink.title} </p>
        <p className="text-lg font-bold text-zinc-400">
          {profileLink.description}
        </p>
        <p className="text-lg font-bold">{profileLink.url}</p>
      </div>
      <div className="col-span-4">
        <div className="flex justify-end gap-4">
          <button className="form_btn_blue">Edit</button>
          <div className="flex aspect-square h-full shrink-0 items-center justify-center rounded-lg">
            <Image src={icon} alt={profileLink.title} width={50} height={50} />
          </div>
        </div>
      </div>
    </div>
  );
}
