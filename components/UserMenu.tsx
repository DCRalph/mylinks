import { signIn, signOut } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";


import type { inferRouterOutputs } from '@trpc/server';
import { type AppRouter } from "~/server/api/root";

type UserMenuProps = {
  user?: inferRouterOutputs<AppRouter>['user']['getUser'];
};

export default function UserMenu({ user }: UserMenuProps) {

  return (
    <>
      {user && (
        <Menu as="div" className="relative inline-block">
          <Menu.Button>
            <div className="h-12 w-12 overflow-hidden rounded-full">
              {user.user?.image && (
                <Image
                  src={user.user?.image}
                  alt="user avatar"
                  width={1000}
                  height={1000}
                />
              )}
            </div>
          </Menu.Button>
          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute flex flex-col gap-2 right-0 mt-2 w-56 origin-top-right divide-gray-100 rounded-md bg-zinc-800 p-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
              <Menu.Item>
                <div className="flex flex-col">
                  <h2 className="text-white text-xl font-semibold">
                    {user.user?.name}
                  </h2>

                  <span className="text-gray-400 text-sm">
                    {user.user?.username} - {user.user?.role}
                  </span>


                </div>
              </Menu.Item>

              {user.user?.requireSetup == false && (<>

                <Menu.Item>
                  <Link
                    className="w-full flex rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                    href={"/dashboard"}
                  >
                    Dashboard
                  </Link>
                </Menu.Item>

                <Menu.Item>
                  <Link
                    className="w-full flex rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                    href={"/settings"}
                  >
                    Settings
                  </Link>
                </Menu.Item>

                {user.user?.role === "admin" && (
                  <Menu.Item>
                    <Link
                      className="w-full flex rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-blue-600 no-underline transition hover:bg-white/20"
                      href={"/admin"}
                    >
                      Admin
                    </Link>
                  </Menu.Item>
                )}

              </>)}


              <Menu.Item>
                <button
                  className="w-full rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-red-600 no-underline transition hover:bg-white/20"
                  onClick={() => void signOut()}
                >
                  Sign out
                </button>
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      )}

      {!user && (
        <button
          className="h-12 rounded-full bg-white/10 px-6 font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={() => void signIn()}
        >
          Sign in
        </button>
      )}
    </>
  );
}
