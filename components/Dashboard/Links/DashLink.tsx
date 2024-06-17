import { type Link } from "@prisma/client";
import { useState } from "react";
import DashLinkEditModel from "./DashLinkEditModel";
import { env } from "~/env";
import NextLink from "next/link";
import { IconPencil } from "@tabler/icons-react";

export default function DashLink({ link }: { link: Link }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex w-full flex-col rounded-lg bg-white px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="text-sm font-semibold md:text-lg">{link.name}</span>
          {/* <span className="md:text-lg text-sm font-semibold">{link.slug}</span> */}
          <NextLink
            href={`${env.NEXT_PUBLIC_DOMAIN}/${link.slug}`}
            target="_blank"
            className="break-all text-sm font-semibold text-blue-600 underline md:text-lg"
          >
            {`${env.NEXT_PUBLIC_DOMAIN}/${link.slug}`}
          </NextLink>
        </div>

        <div className="flex items-center">
          <button
            className="form_btn_blue flex items-center gap-2"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            Edit
            <IconPencil />
          </button>
        </div>
      </div>

      <DashLinkEditModel link={link} isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
