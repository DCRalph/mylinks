import Head from "next/head";
import Link from "next/link";
import Nav from "components/Nav";

import { useSession } from "next-auth/react";

export default function Home() {
  const sessionData = useSession();
  return (
    <>
      <Head>
        <title>mylinks</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-zinc-950">
        <Nav sessionData={sessionData?.data} />

        <div className="mt-16 grid h-4 grid-cols-3">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">
              Next level link shortner
            </h1>
          </div>
        </div>
      </main>
    </>
  );
}
