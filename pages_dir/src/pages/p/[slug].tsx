import { db } from "~/server/db";
import Head from "next/head";
import { getClientIp } from "request-ip";
import { type GetServerSidePropsContext } from "next";
import ProfilePage from "~/components/ProfilePage/ProfilePage";

import { type Profile, type ProfileLink } from "@prisma/client";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const slug = context.query.slug as string;

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

  const userIp = getClientIp(context.req);
  const userUserAgent = context.req.headers["user-agent"] ?? "unknown";
  const userReferer = context.req.headers.referer ?? "unknown";

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

  return {
    props: {
      slug,
      notFound: false,
      profile: profile,
    },
  };
}

export default function Slug({
  slug,
  notFound,
  profile,
}: {
  slug: string;
  notFound: boolean;
  profile: Profile_ProjectLinks;
}) {
  if (profile) {
    return (
      <>
        <Head>
          <title>link2it | Porfile</title>
          <meta name="description" content="Link sharing website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <ProfilePage profile={profile} />
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Head>
          <title>link2it | Not Found</title>
          <meta name="description" content="Link sharing website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <h1 className="text-6xl text-white">Profile "{slug}" Not Found</h1>
        </div>
      </>
    );
  }
}
