"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import Empty from "~/components/Empty";
import LinkDialog from "~/components/Links/LinkDialog";
import LinkTicket, { type TicketLink } from "~/components/Links/LinkTicket";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatNumber, formatRelative } from "~/lib/format";
import { can, isStaff } from "~/lib/permissions";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";
import { Panel } from "./Panel";
import RoleChips from "./RoleChips";
import UserAccess from "./UserAccess";
import UserActions from "./UserActions";
import UserSessions from "./UserSessions";

export type Viewer = { id: string; role?: string | null };

/** /admin/users/[id]: one account's roles, ban, sessions, username and content. */
export default function AdminUser({
  userId,
  viewer,
}: {
  userId: string;
  viewer: Viewer;
}) {
  const [shareDomain] = useShareDomain();
  const user = api.admin.getUser.useQuery({ userID: userId });
  const [editing, setEditing] = useState<TicketLink | null>(null);

  if (user.error) {
    return <Empty title="User not found" className="mt-10" />;
  }
  const data = user.data;
  if (!data) return <p className="text-muted py-20 text-center">Loading…</p>;

  const isSelf = data.id === viewer.id;
  // Moderators can act on ordinary accounts only. src/server/auth.ts enforces it.
  const locked =
    isSelf || (isStaff(data) && !can(viewer, { user: ["set-role"] }));
  const canModerateLinks = can(viewer, { link: ["moderate"] });

  return (
    <>
      <Link
        href="/admin/users"
        className="display text-muted hover:text-ink inline-flex items-center gap-1.5 text-lg"
      >
        <IconArrowLeft className="size-5" /> Users
      </Link>

      <header className="mt-2 mb-6">
        <h2 className="display text-[48px] leading-[1.15] break-words sm:text-[64px]">
          {data.name}
        </h2>
        <p className="text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{data.email}</span>
          {data.username && <span>· @{data.username}</span>}
          <span>· joined {formatRelative(data.createdAt)}</span>
          <span>
            · signs in with{" "}
            {data.accounts
              .map((a) =>
                a.providerId === "credential" ? "a password" : "Google",
              )
              .join(" and ") || "nothing"}
          </span>
          <RoleChips user={data} />
        </p>
        {locked && (
          <p className="text-muted mt-3 text-sm">
            {isSelf
              ? "This is you. Change your own account in Settings."
              : "Only admins can change staff accounts."}
          </p>
        )}
      </header>

      <UserAccess user={data} viewer={viewer} locked={locked} />

      {can(viewer, { session: ["list"] }) && !locked && (
        <UserSessions userId={data.id} viewer={viewer} />
      )}

      <div className="mb-12 grid gap-3.5 md:grid-cols-2">
        {can(viewer, { user: ["update"] }) && <UsernamePanel user={data} />}
        {!locked && <UserActions user={data} viewer={viewer} />}
      </div>

      <h2 className="display mb-4 text-[32px]">
        Links <span className="text-faint">{data.Links.length}</span>
      </h2>
      {data.Links.length === 0 ? (
        <Empty title="No links" className="mb-12" />
      ) : (
        <div className="mb-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.Links.map((link) => (
            <LinkTicket
              key={link.id}
              link={link}
              onEdit={canModerateLinks ? () => setEditing(link) : undefined}
            />
          ))}
        </div>
      )}

      <h2 className="display mb-4 text-[32px]">
        Profiles <span className="text-faint">{data.Profiles.length}</span>
      </h2>
      {data.Profiles.length === 0 ? (
        <Empty title="No profiles" />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {data.Profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/profiles/${profile.id}`}
              className="border-line hover:border-faint flex items-center gap-4 rounded-2xl border-[1.5px] px-5 py-4"
            >
              <div className="min-w-0">
                <p className="display truncate-display text-[28px]">
                  {profile.name}
                </p>
                <p className="text-lime truncate text-sm">
                  {shareDomain.host}/p/{profile.slug}
                </p>
              </div>
              <p className="text-muted ml-auto text-right text-[13px]">
                <span className="display text-ink block text-[30px]">
                  {formatNumber(profile._count.clicks)}
                </span>
                views
              </p>
            </Link>
          ))}
        </div>
      )}

      {editing && (
        <LinkDialog
          key={editing.id}
          link={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function UsernamePanel({
  user,
}: {
  user: { id: string; username: string | null };
}) {
  const utils = api.useUtils();
  // null until edited, so the field shows the saved username.
  const [edited, setEdited] = useState<string | null>(null);
  const username = edited ?? user.username ?? "";

  const rename = api.admin.updateUsername.useMutation({
    onSuccess: async () => {
      toast.success("Username saved");
      setEdited(null);
      await Promise.all([
        utils.admin.getUser.invalidate(),
        utils.admin.getUsers.invalidate(),
      ]);
    },
  });

  return (
    <Panel title="Username">
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          rename.mutate({ userID: user.id, username });
        }}
      >
        <div className="flex gap-2.5">
          <Input
            aria-label="Username"
            required
            value={username}
            onChange={(e) => setEdited(e.target.value)}
          />
          <Button
            type="submit"
            disabled={rename.isPending || username === user.username}
          >
            Save
          </Button>
        </div>
        {rename.error && (
          <p className="text-danger text-sm">{rename.error.message}</p>
        )}
      </form>
    </Panel>
  );
}
