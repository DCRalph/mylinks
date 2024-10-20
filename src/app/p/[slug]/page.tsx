import { db } from "~/server/db";
import Head from "next/head";
import React from "react";
import ProfilePage from "~/components/ProfilePage/ProfilePage";

import { headers } from 'next/headers'


export default async function Slug({ params }: { params: { slug: string } }) {

  const slug = params.slug;

  const profile = await db.profile.findUnique({
    where: {
      slug,
    },
    include: {
      profileLinks: true,
    },
  });

  if (!profile) {
    return {
      props: {
        slug,
        notFound: true,
      },
    };
  }

  const headersInstance = headers()

  const userIp = headersInstance.get('x-real-ip') ?? "unknown";
  const userUserAgent = headersInstance.get('user-agent') ?? "unknown";
  const userReferer = headersInstance.get('referer') ?? "unknown";

  db.click
    .create({
      data: {
        profileId: profile.id,
        userAgent: userUserAgent,
        ipAddress: userIp,
        referer: userReferer,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  profile.profileLinks = profile.profileLinks.filter((link) => link.visible);

  // return {
  //   props: {
  //     slug,
  //     notFound: false,
  //     profile: profile,
  //   },
  // };





  if (profile) {
    return (
      <>
        <ProfilePage profile={profile} />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head>
          <title>link2it | Not Found</title>
          <meta name="description" content="Link sharing website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <h1 className="text-6xl text-white">Profile &quot;{slug}&quot; Not Found</h1>
        </div>
      </>
    );
  }
}
