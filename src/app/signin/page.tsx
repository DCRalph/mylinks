import { redirect } from "next/navigation";

import Brand from "~/components/Brand";
import { getSession, googleEnabled } from "~/server/auth";
import SignInForm from "./SignInForm";

export const metadata = { title: "Sign in" };

// better-auth sends OAuth failures back as ?error=<code>.
const OAUTH_ERRORS: Record<string, string> = {
  account_not_linked:
    "That Google account isn't connected here. Sign in with your password, then connect Google in Settings.",
  access_denied: "Google sign-in was cancelled.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/dashboard");

  const { error } = await searchParams;
  const oauthError = error
    ? (OAUTH_ERRORS[error] ?? "Google sign-in didn't work. Try again.")
    : null;

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col gap-8 p-6 sm:p-10 lg:justify-between lg:p-14">
        <Brand />
        <h1 className="display text-[112px] leading-[1.15] sm:text-[150px] lg:text-[210px]">
          Sign
          <br />
          <span className="text-lime">in.</span>
        </h1>
      </section>
      <section className="flex items-center p-6 pt-0 sm:p-10 lg:bg-panel lg:p-14">
        <SignInForm googleEnabled={googleEnabled} initialError={oauthError} />
      </section>
    </main>
  );
}
