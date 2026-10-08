import { redirect } from "next/navigation";

import Brand from "~/components/Brand";
import { getSession } from "~/server/auth";
import SetupForm from "./SetupForm";

export const metadata = { title: "Pick a username" };

/** First stop after signing up with Google. */
export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (!session.user.requireSetup) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col p-6 sm:p-10">
      <Brand />
      <div className="my-auto py-12">
        <p className="text-muted">Welcome, {session.user.name}.</p>
        <h1 className="display mt-3 mb-8 text-[80px] leading-[1.15] sm:text-[120px]">
          Pick a <span className="text-lime">username.</span>
        </h1>
        <SetupForm />
      </div>
    </main>
  );
}
