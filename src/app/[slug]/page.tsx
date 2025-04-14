import { db } from "~/server/db";
import Head from "next/head";
import React, { use } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const link = await db.link.findFirst({
    where: {
      slug,
    },
  });

  if (slug && link) {
    const headersInstance = await headers();

    const userIp = headersInstance.get("x-real-ip") ?? "unknown";
    const userUserAgent = headersInstance.get("user-agent") ?? "unknown";
    const userReferer = headersInstance.get("referer") ?? "unknown";

    db.click
      .create({
        data: {
          linkId: link.id,
          userAgent: userUserAgent,
          ipAddress: userIp,
          referer: userReferer,
        },
      })
      .catch((err) => {
        console.error(err);
      });

    redirect(link.url);
    return (
      <div>
        <h1>Redirecting...</h1>
      </div>
    );
  }

  if (!link) {
    return (
      <>
        <Head>
          <title>link2it | Not Found</title>
          <meta name="description" content="Link sharing website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <h1 className="text-6xl text-white">
            Link &quot;{slug}&quot; Not Found
          </h1>
        </div>
      </>
    );
  }
}
