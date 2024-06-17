import { type Link as LinkType } from "@prisma/client";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link"
import { env } from "~/env";

export default function AdminUserLinkCard({ link }: { link: LinkType }) {
  return (
    <div className="grid grid-cols-12 gap-4 rounded-lg border-2 border-zinc-600 bg-zinc-900 p-4 text-white shadow-lg">
      <div className="col-span-12">
        <p className="text-3xl font-bold pb-4">{link.name}</p>
        <Link className="text-lg font-bold underline flex items-center gap-2" href={`${env.NEXT_PUBLIC_DOMAIN}/${link.slug}`} target="_blank">
          {env.NEXT_PUBLIC_SHORT_DOMAIN}/{link.slug}
          <IconExternalLink />
        </Link>
        <p className="text-lg font-bold">{link.url}</p>
      </div>
    </div>
  );
}
