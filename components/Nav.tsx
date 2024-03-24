import UserMenu from "./UserMenu";
import Link from "next/link";

import type { inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from "~/server/api/root";

type NavProps = {
  user?: inferRouterOutputs<AppRouter>['user']['getUser'];
};

export default function Nav({ user }: NavProps) {

  return (
    <nav className="flex h-20 w-full items-center bg-white/10 px-20 py-2 backdrop-blur-lg">
      <Link href={"/"} className="text-xl text-white">
        linky dink
      </Link>

      <div className="ml-auto flex gap-4">
        <UserMenu user={user} />
      </div>
    </nav>
  );
}
