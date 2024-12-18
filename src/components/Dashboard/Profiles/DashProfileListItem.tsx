import { type Profile, type ProfileLink } from "@prisma/client";
import { useState } from "react";
import DashProfileEditModel from "./DashProfileEditModel";
import Link from "next/link";
import { env } from "~/env";
import { IconPencil } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function DashProfileListItem({
  profile,
}: {
  profile: Profile_ProjectLinks;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const editBtn = () => {
    setIsOpen(true);
  };

  return (
    <div className="flex w-full flex-col rounded-lg bg-white px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="text-sm text-black font-semibold md:text-lg">
            {profile.name} {profile.altName && `(${profile.altName})`}
          </span>
          {/* <span className="text-sm font-semibold md:text-lg">
            {profile.slug}
          </span> */}
          <Link
            href={`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
            target="_blank"
            className="break-all text-sm font-semibold text-blue-600 underline md:text-lg"
          >
            {`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
          </Link>
        </div>

        <div className="flex items-center">
          <Button
            className="form_btn_blue flex gap-2 items-center"
            onClick={() => {
              editBtn();
            }}
          >
            <IconPencil/>
            Edit
          </Button>
        </div>
      </div>

      <DashProfileEditModel
        profile={profile}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </div>
  );
}
