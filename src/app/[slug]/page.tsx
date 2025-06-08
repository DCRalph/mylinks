import { db } from "~/server/db";
import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ParallaxCard from "~/components/ParallaxCard";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
  }

  if (!link || !slug) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Decorative Elements */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl"></div>
          <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl"></div>
          <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"></div>
        </div>

        <ParallaxCard slug={slug} />
      </main>
    );
  }
}
