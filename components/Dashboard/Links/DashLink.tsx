import { type Link } from "@prisma/client";
import { useState } from "react";
import DashLinkEditModel from "./DashLinkEditModel";


export default function DashLink({ link }: { link: Link }) {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg w-full flex flex-col px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="md:text-lg text-sm font-semibold">url</span>
          <span className="md:text-lg text-sm font-semibold">{link.slug}</span>
        </div>

        <div className="flex items-center">
          <button className="px-4 h-10 text-sm md:text-lg rounded-lg bg-blue-500" onClick={() => {
            setIsOpen(true);
          }}>Edit</button>
        </div>
      </div>

      <DashLinkEditModel link={link} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );

}

