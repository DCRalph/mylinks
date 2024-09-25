import { db } from "~/server/db";
import Head from "next/head";
import { getClientIp } from "request-ip";
import { type GetServerSidePropsContext } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const slug = context.query.slug as string;

  const url = await db.link.findUnique({
    where: {
      slug,
    },
  });

  if (!url) {
    // return {
    //   redirect: {
    //     destination: '/',
    //     permanent: false,
    //   },
    // };

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
        linkId: url.id,
        userAgent: userUserAgent,
        ipAddress: userIp,
        referer: userReferer,
      },
    })
    .catch((err) => {
      console.error(err);
    });

  return {
    redirect: {
      destination: url.url,
      permanent: true,
    },
  };

  return {
    props: {
      slug,
    },
  };
}

export default function Slug({
  slug,
  notFound,
}: {
  slug: string;
  notFound: boolean;
}) {
  if (slug && !notFound) {
    return (
      <div>
        <h1>Redirecting...</h1>
      </div>
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
          <h1 className="text-6xl text-white">Link "{slug}" Not Found</h1>
        </div>
      </>
    );
  }
}
