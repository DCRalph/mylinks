import { type Link } from "@prisma/client";
import { useState } from "react";
import DashLinkEditModel from "./DashLinkEditModel";
import { toast } from 'react-toastify';


export default function DashLink({ url }: { url: Link }) {

  const [isOpen, setIsOpen] = useState(false);

  const editBtn = (url: Link) => {
    // toast.info(url.id);
    setIsOpen(true);
  }

  return (
    <div className=" bg-white rounded-lg w-full flex flex-col px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="text-lg font-semibold">{url.url}</span>
          <span className="text-lg font-semibold">{url.slug}</span>
        </div>

        <div className="flex items-center">
          <button className="px-4 h-10 rounded-lg bg-blue-500" onClick={() => {
            // alert(url.id)
            editBtn(url)
          }}>Edit</button>
        </div>
      </div>

      <DashLinkEditModel url={url} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );

}

