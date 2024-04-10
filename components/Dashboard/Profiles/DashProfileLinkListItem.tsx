import { type ProfileLink } from "@prisma/client";
import { useState } from "react";
import DashProfileLinkEditModel from "./DashProfileEditLinkModel";
import Link from "next/link";

export default function DashProfileLink({
  profileLink,
}: {
  profileLink: ProfileLink;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const editBtn = () => {
    // toast.info(profileLink.title);
    setIsOpen(true);
  };

  return (
    <div className="flex w-full flex-col rounded-lg bg-white px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="text-sm font-semibold md:text-lg">
            {profileLink.title}
          </span>
          <Link
            href={profileLink.url}
            target="_blank"
            className="break-all text-sm font-semibold text-blue-600 underline md:text-lg"
          >
            {profileLink.url}
          </Link>
        </div>

        <div className="flex items-center">
          <button
            className="form_btn_blue"
            onClick={() => {
              editBtn();
            }}
          >
            Edit
          </button>
        </div>
      </div>

      <DashProfileLinkEditModel
        profileLink={profileLink}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </div>
  );
}
