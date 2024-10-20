"use client";

import Nav from "~/components/Nav";
import Head from "next/head";
import { api } from "~/trpc/react";

import Footer from "~/components/footer";

export default function SpyPixelPage() {
  const myUser = api.user.getUser.useQuery();

  return (
    <>
      <Head>
        <title>link2it | Admin</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 grid h-4 grid-cols-12">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">Spy Pixel</h1>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
