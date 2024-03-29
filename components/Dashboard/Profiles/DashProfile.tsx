import { type Profile, type ProfileLink } from "@prisma/client";
import { useState } from "react";
import { toast } from 'react-toastify';
import DashProfileEditModel from "./DashProfileEditModel";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function DashProfileItem({ profile }: { profile: Profile_ProjectLinks }) {

  const [isOpen, setIsOpen] = useState(false);

  const editBtn = () => {
    setIsOpen(true);
  }

  return (
    <div className="bg-white rounded-lg w-full flex flex-col px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="md:text-lg text-sm font-semibold">{profile.name}</span>
          <span className="md:text-lg text-sm font-semibold">{profile.slug}</span>
        </div>

        <div className="flex items-center">
          <button className="px-4 h-10 text-sm md:text-lg rounded-lg bg-blue-500" onClick={() => {
            editBtn()
          }}>Edit</button>
        </div>
      </div>

      <DashProfileEditModel profile={profile} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );

}

