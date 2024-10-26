import { signIn, signOut } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";

import type { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "~/server/api/root";
import {
  IconBookmarks,
  IconLayoutDashboard,
  IconLogout,
  IconSettings,
  IconSpy,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "./ui/button";

type UserMenuProps = {
  user?: inferRouterOutputs<AppRouter>["user"]["getUser"];
};

function getUserPermText(user: UserMenuProps["user"]) {
  if (!user) return "Not signed in";

  if (user.user?.admin) return "Admin";
  if (user.user?.spyPixel) return "Spy";
  return "User";
}

export default function UserMenu({ user }: UserMenuProps) {
  return (
    <>
      {user?.user != null && (
        <Menu as="div" className="relative inline-block">
          <Menu.Button>
            <div className="h-12 w-12 overflow-hidden rounded-full">
              {user.user?.image && (
                <Image
                  src={user.user?.image}
                  alt="user avatar"
                  width={100}
                  height={100}
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
            <Menu.Items className="absolute right-0 mt-2 flex w-56 origin-top-right flex-col gap-2 divide-gray-100 rounded-md bg-zinc-800 p-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
              <Menu.Item>
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-white">
                    {user.user?.name}
                  </h2>

                  <span className="text-sm text-gray-400">
                    {user.user?.username} - {getUserPermText(user)}
                  </span>
                </div>
              </Menu.Item>

              {user.user?.requireSetup == false && (
                <>
                  <Menu.Item>
                    <Link
                      className="flex w-full items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                      href={"/dashboard"}
                    >
                      <IconLayoutDashboard />
                      Dashboard
                    </Link>
                  </Menu.Item>

                  <Menu.Item>
                    <Link
                      className="flex w-full items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                      href={"/bookmarks"}
                    >
                      <IconBookmarks />
                      Bookmarks
                    </Link>
                  </Menu.Item>

                  {(user.user?.admin || user.user?.spyPixel) && (
                    <Menu.Item>
                      <Link
                        className="flex w-full items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                        href={"/spy-pixel"}
                      >
                        <IconSpy />
                        Spy Pixel
                      </Link>
                    </Menu.Item>
                  )}

                  <Menu.Item>
                    <Link
                      className="flex w-full items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                      href={"/settings"}
                    >
                      <IconSettings />
                      Settings
                    </Link>
                  </Menu.Item>

                  {user.user?.admin && (
                    <Menu.Item>
                      <Link
                        className="flex w-full items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-blue-600 no-underline transition hover:bg-white/20"
                        href={"/admin"}
                      >
                        <IconUsers />
                        Admin
                      </Link>
                    </Menu.Item>
                  )}
                </>
              )}

              {user.user?.requireSetup == true && (
                <Menu.Item>
                  <Link
                    className="flex w-full items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-left font-semibold text-white no-underline transition hover:bg-white/20"
                    href={"/setup"}
                  >
                    Setup
                  </Link>
                </Menu.Item>
              )}

              <Menu.Item>
                <Button
                  className="flex w-full items-center justify-start gap-2 rounded-md bg-white/10 px-4 py-2 text-start text-base font-semibold text-red-600 no-underline transition hover:bg-white/20"
                  onClick={() => void signOut()}
                >
                  <IconLogout />
                  Sign out
                </Button>
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      )}

      {user?.user == null && (
        <Button
          className="h-12 rounded-full bg-white/10 px-6 font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={() => void signIn()}
        >
          Sign in
        </Button>
      )}
    </>
  );
}
