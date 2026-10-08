"use client";

import { IconLogout, IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authClient } from "~/lib/auth-client";
import { reloadTo } from "~/lib/utils";
import type { ShellUser } from "./AppShell";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const signOut = async () => {
  await authClient.signOut();
  reloadTo("/");
};

export default function UserMenu({ user }: { user: ShellUser }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="bg-lime text-lime-ink grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full text-[13px] font-bold"
      >
        {user.image && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny avatar from Google
          <img
            src={user.image}
            alt=""
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          initials(user.name)
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="text-ink font-medium">{user.name}</span>
          <span className="truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <IconSettings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <IconLogout />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
