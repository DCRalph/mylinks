import { type Link as LinkType } from "@prisma/client";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { env } from "~/env";

export default function AdminUserLinkCard({ link }: { link: LinkType }) {
  return (
    <div className="grid grid-cols-12 gap-4 rounded-lg border-2 border-zinc-600 bg-zinc-900 p-4 text-white shadow-lg">
      <div className="col-span-12">
        <p className="break-all pb-4 text-3xl font-bold">{link.name}</p>
        <Link
          className="flex items-center gap-2 break-all text-sm lg:text-lg font-bold underline"
          href={`${env.NEXT_PUBLIC_DOMAIN}/${link.slug}`}
          target="_blank"
        >
          {env.NEXT_PUBLIC_SHORT_DOMAIN}/{link.slug}
          <IconExternalLink />
        </Link>
        <p className="break-all text-sm lg:text-lg font-bold">{link.url}</p>
      </div>
    </div>
  );
}
