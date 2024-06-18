import Head from "next/head";
import Nav from "~/components/Nav";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { api } from "~/utils/api";
import { type GetServerSidePropsContext } from "next";
import { checkRequireSetup } from "~/utils/requireSetup";
import Footer from "~/components/footer";
import { IconLayoutDashboard } from "@tabler/icons-react";

export default function Home() {
  const myUser = api.user.getUser.useQuery();

  return (
    <>
      <Head>
        <title>link2it</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className=" mt-16 grid grid-cols-3">
          <div className="col-span-full flex justify-center">
            <h1 className="text-3xl font-bold text-white lg:text-5xl">
              Next level link shortner
            </h1>
          </div>
        </div>

        <div className="mx-8 mt-16 flex flex-col items-center">
          <div className="w-full max-w-lg rounded-lg border border-zinc-600 bg-zinc-800 p-4">
            <h1 className="mb-4 text-center text-2xl font-bold text-red-600 lg:text-3xl">
              BETA
            </h1>
            <h1 className="text-center text-2xl font-bold text-white lg:text-3xl">
              More info comming soon
            </h1>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold text-white">Get started</h1>

            {myUser.data ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                Dashboard
                <IconLayoutDashboard />
              </Link>
            ) : (
              <button
                className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                onClick={() => void signIn()}
              >
                Sign in
              </button>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const needsSetup = await checkRequireSetup(context);

  if (needsSetup) {
    return {
      redirect: {
        destination: "/setup",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
