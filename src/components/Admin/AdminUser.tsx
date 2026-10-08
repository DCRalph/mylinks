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
import { Switch } from "~/components/ui/switch";
import { formatNumber } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";

/** /admin/user/[id]: one user's flags, username, links and profiles. */
export default function AdminUser({
  userId,
  currentUserId,
}: {
  userId: string;
  currentUserId: string;
}) {
  const [shareDomain] = useShareDomain();
  const user = api.admin.getUser.useQuery({ userID: userId });
  const utils = api.useUtils();
  const [editedUsername, setUsername] = useState<string | null>(null);
  const [editing, setEditing] = useState<TicketLink | null>(null);

  const refresh = () =>
    Promise.all([
      utils.admin.getUser.invalidate(),
      utils.admin.getUsers.invalidate(),
    ]);
  const onError = (error: { message: string }) => toast.error(error.message);

  const toggleAdmin = api.admin.toggleAdminStatus.useMutation({
    onSuccess: refresh,
    onError,
  });
  const togglePixels = api.admin.toggleSpyPixelStatus.useMutation({
    onSuccess: refresh,
    onError,
  });
  const rename = api.admin.updateUsername.useMutation({
    onSuccess: async () => {
      toast.success("Username saved");
      setUsername(null);
      await refresh();
    },
  });

  if (user.error) {
    return <Empty title="User not found" className="mt-10" />;
  }
  const data = user.data;
  if (!data) return <p className="text-muted py-20 text-center">Loading…</p>;

  const username = editedUsername ?? data.username ?? "";
  const isSelf = data.id === currentUserId;

  return (
    <>
      <Link
        href="/admin"
        className="display text-muted hover:text-ink inline-flex items-center gap-1.5 text-lg"
      >
        <IconArrowLeft className="size-5" /> Admin
      </Link>

      <header className="mt-3 mb-8">
        <h1 className="display text-[64px] leading-[1.15] break-words sm:text-[88px]">
          {data.name}
        </h1>
        <p className="text-muted mt-2">
          {data.email}
          {data.username && <> · @{data.username}</>}
        </p>
      </header>

      <div className="mb-12 grid gap-3.5 md:grid-cols-2">
        <section className="bg-panel rounded-2xl p-5">
          <h2 className="display mb-4 text-[28px]">Access</h2>
          <label className="flex items-center justify-between gap-4 py-2">
            <span>
              <span className="block font-semibold">Admin</span>
              <span className="text-muted text-sm">
                {isSelf
                  ? "You can't change your own."
                  : "Full access to every account."}
              </span>
            </span>
            <Switch
              checked={data.admin}
              disabled={isSelf || toggleAdmin.isPending}
              onCheckedChange={() => toggleAdmin.mutate({ userID: data.id })}
            />
          </label>
          <label className="flex items-center justify-between gap-4 py-2">
            <span>
              <span className="block font-semibold">Pixels</span>
              <span className="text-muted text-sm">
                Can create tracking pixels.
              </span>
            </span>
            <Switch
              checked={data.spyPixel}
              disabled={togglePixels.isPending}
              onCheckedChange={() => togglePixels.mutate({ userID: data.id })}
            />
          </label>
        </section>

        <section className="bg-panel rounded-2xl p-5">
          <h2 className="display mb-4 text-[28px]">Username</h2>
          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              rename.mutate({ userID: data.id, username });
            }}
          >
            <div className="flex gap-2.5">
              <Input
                aria-label="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button
                type="submit"
                disabled={rename.isPending || username === data.username}
              >
                Save
              </Button>
            </div>
            {rename.error && (
              <p className="text-danger text-sm">{rename.error.message}</p>
            )}
          </form>
          <p className="text-muted mt-4 text-sm">
            Signs in with{" "}
            {data.accounts
              .map((a) =>
                a.providerId === "credential" ? "a password" : "Google",
              )
              .join(" and ") || "nothing"}
            .
          </p>
        </section>
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
              onEdit={() => setEditing(link)}
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
