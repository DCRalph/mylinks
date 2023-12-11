import { type SessionContextValue, signIn, signOut } from "next-auth/react";

export default function AuthButton({
  sessionData,
}: {
  sessionData: SessionContextValue;
}) {
  const session = sessionData?.data;

  return (
    <button
      className="h-12 rounded-full bg-white/10 px-6 font-semibold text-white no-underline transition hover:bg-white/20"
      onClick={session ? () => void signOut() : () => void signIn()}
    >
      {session ? "Sign out" : "Sign in"}
    </button>
  );
}
