import { type SessionContextValue } from "next-auth/react";
import Image from "next/image";

import AuthButton from "./AuthButton";
import Link from "next/link";

export default function Nav({
  sessionData,
}: {
  sessionData: SessionContextValue;
}) {
  const session = sessionData?.data;

  return (
    <nav className="flex h-20 w-full items-center bg-white/10 px-20 py-2 backdrop-blur-lg">
      <div className="text-xl text-white">linky dink</div>

      <div className="ml-auto flex gap-4">
        {session && (
          <Link
            href={"/dashboard"}
            className="flex h-12 items-center rounded-full bg-white/10 px-6 font-semibold text-white no-underline transition hover:bg-white/20"
          >
            Dashboard
          </Link>
        )}

        {session?.user?.image && (
          <div className="h-10 w-10 overflow-hidden rounded-full bg-red-500">
            <Image
              src={session.user.image}
              alt="user avatar"
              width={1000}
              height={1000}
            />
          </div>
        )}
        <AuthButton sessionData={sessionData} />
      </div>
    </nav>
  );
}
