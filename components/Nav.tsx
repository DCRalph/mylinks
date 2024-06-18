import UserMenu from "./UserMenu";
import Link from "next/link";

import type { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";
import { IconLink } from "@tabler/icons-react";

type NavProps = {
  user?: inferRouterOutputs<AppRouter>["user"]["getUser"];
};

export default function Nav({ user }: NavProps) {
  return (
    <>
    <nav className="flex h-20 w-full items-center bg-black/50 fixed px-8 sm:px-20 py-2 backdrop-blur-lg">
      <Link href={"/"} className="text-xl font-bold text-white flex items-center gap-2">
        <IconLink/>
        link2it
      </Link>

      <div className="ml-auto flex gap-4">
        <UserMenu user={user} />
      </div>
    </nav>
    <div className="h-20"></div>
    </>
  );
}
