import { type ProfileLink } from "@prisma/client";
import { useState } from "react";
import DashProfileLinkEditModel from "./DashProfileEditLinkModel";
import Link from "next/link";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
import { IconEye, IconEyeOff, IconPencil } from "@tabler/icons-react";
import toastOptions from "~/utils/toastOptions";

export default function DashProfileLink({
  profileLink,
}: {
  profileLink: ProfileLink;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const profiles = api.profile.getProfiles.useQuery();
  const toggleProfileLinkVisibilityMutation =
    api.profile.toggleProfileLinkVisibility.useMutation();

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
          profiles
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

        <div className="flex items-center gap-2">
          <button
            className={`${profileLink.visible ? "form_btn_green" : "form_btn_red"} flex items-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300`}
            onClick={() => {
              toggleVisibility();
            }}
            disabled={toggleProfileLinkVisibilityMutation.isLoading}
          >
            {profileLink.visible ? "Shown" : "Hidden"}
            {profileLink.visible ? (
              <IconEye/>
            ) : (
              <IconEyeOff/>
            )}
          </button>
          <button
            className="form_btn_blue flex items-center gap-2"
            onClick={() => {
              editBtn();
            }}
          >
            Edit{" "}
            <IconPencil/>
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
