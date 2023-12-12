
import { type Session } from "next-auth";

import AuthButton from "./AuthButton";
import Link from "next/link";

export default function Nav({
  sessionData,
}: {
  sessionData: Session | null;
}) {

  return (
    <nav className="flex h-20 w-full items-center bg-white/10 px-20 py-2 backdrop-blur-lg">
      <Link href={"/"} className="text-xl text-white">
        linky dink
      </Link>

      <div className="ml-auto flex gap-4">
        <AuthButton sessionData={sessionData} />
      </div>
    </nav>
  );
}
