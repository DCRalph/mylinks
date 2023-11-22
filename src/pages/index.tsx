import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { api } from "~/utils/api";

export default function Home() {
  const hello = api.post.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>mylinks</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-zinc-950">
        <nav className="flex h-20 w-full items-center bg-white/10 px-20 py-2 backdrop-blur-lg">
          <div className="text-xl text-white">mylinks</div>
          <AuthButton />
        </nav>
      </main>
    </>
  );
}

function AuthButton() {
  const { data: sessionData } = useSession();
  return (
    <div className="ml-auto flex items-center gap-4">
      {sessionData?.user?.image && (
        <div className="h-10 w-10 rounded-full bg-red-500 overflow-hidden">
          <Image src={sessionData.user.image} alt="user avatar" width={1000} height={1000} />
        </div>
      )}

      <button
        className="h-12 rounded-full bg-white/10 px-10 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
