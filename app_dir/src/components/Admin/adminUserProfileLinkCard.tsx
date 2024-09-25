import { type ProfileLink } from "@prisma/client";
import { defualtIcon } from "~/utils/profileLinkIcons";
import Image from "next/image";
import { IconEye, IconEyeOff, IconPencil } from "@tabler/icons-react";
import { useState } from "react";

import DashProfileLinkEditModel from "~/components/Dashboard/Profiles/DashProfileEditLinkModel";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";

export default function AdminUserProfileLinkCard({
  profileLink,
  userID,
}: {
  profileLink: ProfileLink;
  userID: string;
}) {
  const icon = profileLink.iconUrl
    ? "/profileLinkIcons/" + profileLink.iconUrl
    : "/profileLinkIcons/" + defualtIcon.icon;

  const user = api.admin.getUser.useQuery({ userID });

  const toggleProfileLinkVisibilityMutation =
    api.profile.toggleProfileLinkVisibility.useMutation();

  const [isOpen, setIsOpen] = useState(false);

  const editBtn = () => {
    // toast.info(profileLink.title);
    setIsOpen(true);
  };

  const toggleVisibility = () => {
    toggleProfileLinkVisibilityMutation.mutate(
      {
        id: profileLink.id,
      },
      {
        onSuccess: (res) => {
          const msg = res.visible
            ? "Link is now visible"
            : "Link is now hidden";
          toast.success(msg, toastOptions);
          user
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, toastOptions);
            });
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 rounded-lg border-2 border-zinc-600 bg-zinc-900 p-4 text-white shadow-lg">
      <div className="col-span-8">
        <p className="break-all text-3xl font-bold">{profileLink.title} </p>
        <p className="break-all text-lg font-bold text-zinc-400">
          {profileLink.description}
        </p>
        <p className="break-all text-lg font-bold">{profileLink.url}</p>
      </div>
      <div className="col-span-4">
        <div className="flex justify-end gap-4">
          <div className="flex aspect-square h-full shrink-0 items-center justify-center rounded-lg bg-zinc-700 p-1">
            <Image src={icon} alt={profileLink.title} width={50} height={50} />
          </div>
        </div>
      </div>
      <div className="col-span-full flex gap-4">
        <button
          className="form_btn_blue flex items-center gap-2"
          onClick={editBtn}
        >
          Edit
          <IconPencil />
        </button>
        <button
          className={`${profileLink.visible ? "form_btn_green" : "form_btn_red"} flex items-center gap-2`}
          onClick={toggleVisibility}
        >
          {profileLink.visible ? "Shown" : "Hidden"}
          {profileLink.visible ? <IconEye /> : <IconEyeOff />}
        </button>
      </div>

      <DashProfileLinkEditModel
        profileLink={profileLink}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </div>
  );
}
