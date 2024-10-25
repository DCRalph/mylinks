"use client";
import { IconLayoutDashboard, IconLoader2 } from "@tabler/icons-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import { Button } from "~/components/ui/button";

// import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/react";

export default function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  // const session = await getServerAuthSession();

  // void api.post.getLatest.prefetch();

  const myUser = api.user.getUser.useQuery();

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950">
      <Nav user={myUser.data} />
      <div className="mt-16 grid grid-cols-3">
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

          {myUser.isPending ? (
            <Button className="form_btn_blue" disabled>
              <IconLoader2 className="animate-spin" />
              Loading...
            </Button>
          ) : myUser.data ? (
            <Link
              href="/dashboard"
              className="form_btn_blue flex items-center gap-2"
            >
              <IconLayoutDashboard />
              Dashboard
            </Link>
          ) : (
            <Button
              className="form_btn_blue flex items-center gap-2"
              onClick={() => void signIn()}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </main>
    // </HydrateClient>
  );
}
