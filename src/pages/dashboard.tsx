import Nav from "components/Nav";
import Head from "next/head";

import { type GetServerSidePropsContext } from "next";
import { requireAuth } from "~/utils/requreAuth";
import { type Session } from "next-auth";
// import { db } from "~/server/db";

export default function Dashboard({
  sessionData,
}: {
  sessionData: Session;
}) {
  console.log(sessionData);

  // const links = db.user.findMany({
  //   where: {
  //     id: sessionData.user.id,
  //   },
  // });

  // console.log(links)

  return (
    <>
      <Head>
        <title>mylinks | dashboard</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-zinc-950">
        <Nav sessionData={sessionData} />

        <div className="mt-16 grid h-4 grid-cols-3">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">dashboard</h1>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return requireAuth(context, ({ session }) => ({
    props: {
      sessionData: session,
    },
  }));
}
