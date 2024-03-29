import { type ProfileLink } from "@prisma/client";
import { useState } from "react";
import { toast } from 'react-toastify';
import DashProfileLinkEditModel from "./DashProfileLinkEditModel";


export default function DashProfileLink({ profileLink }: { profileLink: ProfileLink }) {

  const [isOpen, setIsOpen] = useState(false);

  const editBtn = () => {
    // toast.info(profileLink.title);
    setIsOpen(true);
  }

  return (
    <div className="bg-white rounded-lg w-full flex flex-col px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="md:text-lg text-sm font-semibold">{profileLink.title}</span>
          <span className="md:text-lg text-sm font-semibold">{profileLink.url}</span>
        </div>

        <div className="flex items-center">
          <button className="px-4 h-10 text-sm md:text-lg rounded-lg bg-blue-500" onClick={() => {
            editBtn()
          }}>Edit</button>
        </div>
      </div>

      <DashProfileLinkEditModel profileLink={profileLink} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );

}
