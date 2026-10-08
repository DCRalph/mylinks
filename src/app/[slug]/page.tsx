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

  void db.click
    .create({ data: { linkId: link.id, ...visitorInfo(await headers()) } })
    .catch(console.error);

  redirect(link.url);
}
