import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";

import TurnedOff from "~/components/TurnedOff";
import { isPrefetch, visitorInfo } from "~/server/clicks";
import { db } from "~/server/db";
import { findLinkBySlug } from "~/server/slugs";

/** Short link resolver. Works on every active domain. */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const link = await findLinkBySlug((await params).slug);
  if (!link) notFound();
  if (link.disabledAt) return <TurnedOff what="link" />;

  // Redirect first, record once the response is on its way.
  const visit = await headers();
  if (!isPrefetch(visit)) {
    after(async () => {
      await db.click.create({
        data: { linkId: link.id, ...(await visitorInfo(visit)) },
      });
    });
  }

  redirect(link.url);
}
