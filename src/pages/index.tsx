import Head from "next/head";
import Nav from "components/Nav";
import { signIn } from "next-auth/react";
import Link from "next/link";

import { api } from "~/utils/api";
import { type GetServerSidePropsContext } from "next";
import { checkRequireSetup } from "~/utils/requireSetup";
import Footer from "components/footer";

export default function Home() {
  const myUser = api.user.getUser.useQuery();

  return (
    <>
      <Head>
        <title>link2it</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative min-h-screen bg-zinc-950 pb-32">
        <Nav user={myUser.data} />

        <div className=" mt-16 grid h-4 grid-cols-3">
          <div className="col-span-full flex justify-center">
            <h1 className="text-3xl font-bold text-white lg:text-5xl">
              Next level link shortner
            </h1>
          </div>
        </div>

        <div className="mt-32 flex justify-center">
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-3xl font-bold text-white">Get started</h1>

            {myUser.data ? (
              <Link
                href="/dashboard"
                className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                Dashboard
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
