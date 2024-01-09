import Nav from "components/Nav";
import Head from "next/head";

import { env } from "~/env.js";

import { type GetServerSidePropsContext } from "next";
import { requireAuth } from "~/utils/requreAuth";
import { type Session } from "next-auth";
import Copy from "components/copy";
// import { db } from "~/server/db";

export default function Dashboard({ sessionData }: { sessionData: Session }) {
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
          {/*  */}
          <div className="col-span-full flex flex-col items-center">
            {/* <h1 className="text-5xl font-bold text-white">dashboard</h1> */}

            <h1 className="text-5xl font-bold text-white">
              Welcome {}
              {sessionData.user.name}
            </h1>
          </div>

          <div className="col-span-full mt-16 flex items-center justify-center gap-4">
            <span className=" text-2xl text-white">Your personal link is:</span>

            <div className="rounded-lg border-2 border-slate-600 bg-black bg-opacity-10 px-4 py-2 shadow-md ">
              <span className=" flex items-center text-2xl text-white">
                {env.NEXT_PUBLIC_SHORT_DOMAIN}/{sessionData.user.name}
                <Copy text={`${env.NEXT_PUBLIC_DOMAIN}/${sessionData.user.name}`} />
              </span>
            </div>
          </div>
          {/*  */}
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
