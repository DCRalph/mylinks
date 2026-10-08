import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { visitorInfo } from "~/server/clicks";
import { db } from "~/server/db";
import { findLinkBySlug } from "~/server/slugs";

/** Short link resolver. Works on every configured domain. */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const link = await findLinkBySlug((await params).slug);
  if (!link) notFound();

  const visit = await headers();
  void visitorInfo(visit)
    .then((info) => db.click.create({ data: { linkId: link.id, ...info } }))
    .catch(console.error);

  redirect(link.url);
}
