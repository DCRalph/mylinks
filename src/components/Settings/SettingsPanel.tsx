"use client";

import { IconDownload, IconKey } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import GoogleIcon from "~/components/GoogleIcon";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";
import { api } from "~/trpc/react";
import DeleteAccountDialog from "./DeleteAccountDialog";
import PasswordDialog, { type PasswordMode } from "./PasswordDialog";
import SessionsSection from "./SessionsSection";

/** /settings: username, sign-in methods, sessions, data export, account deletion. */
export default function SettingsPanel({
  googleEnabled,
  currentSessionId,
}: {
  googleEnabled: boolean;
  currentSessionId: string;
}) {
  const me = api.user.getUser.useQuery();
  const utils = api.useUtils();
  const user = me.data?.user;

  // null until edited, so the field shows the saved username.
  const [editedUsername, setUsername] = useState<string | null>(null);
  const username = editedUsername ?? user?.username ?? "";
  const [passwordDialog, setPasswordDialog] = useState<PasswordMode | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const saveUsername = api.user.setUsername.useMutation({
    onSuccess: async () => {
      toast.success("Username saved");
      setUsername(null);
      await utils.user.getUser.invalidate();
    },
  });

  const exportData = api.user.exportUserData.useQuery(undefined, {
    enabled: false,
  });

  if (!user) {
    return <p className="text-muted py-20 text-center">Loading…</p>;
  }

  const accounts = user.accounts;
  const google = accounts.find((a) => a.providerId === "google");
  const hasPassword = accounts.some((a) => a.providerId === "credential");
  const canRemoveOne = accounts.length > 1;

  const connectGoogle = async () => {
    const { error } = await authClient.linkSocial({
      provider: "google",
      callbackURL: "/settings",
      errorCallbackURL: "/settings",
    });
    if (error) toast.error(error.message ?? "Couldn't reach Google");
  };

  const disconnectGoogle = async (accountId: string) => {
    const { error } = await authClient.unlinkAccount({ accountId });
    if (error) {
      toast.error(
        error.code === "SESSION_EXPIRED"
          ? "For safety, sign out and back in, then try again."
          : (error.message ?? "Couldn't disconnect Google"),
      );
      return;
    }
    toast.success("Google disconnected");
    await utils.user.getUser.invalidate();
  };

  const download = async () => {
    const { data } = await exportData.refetch();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `link2it-${user.username ?? "export"}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    // Revoking straight away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="display mb-8 text-[60px] leading-[1.15] sm:text-[96px]">
        Settings
      </h1>

      <Section title="Account">
        <div className="mb-5">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-muted">{user.email}</p>
        </div>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveUsername.mutate({ name: username });
          }}
        >
          <label htmlFor="username" className="display text-muted text-base">
            Username
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Input
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button
              type="submit"
              disabled={saveUsername.isPending || username === user.username}
            >
              {saveUsername.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          {saveUsername.error && (
            <p className="text-danger text-sm">{saveUsername.error.message}</p>
          )}
        </form>
      </Section>

      <Section title="Sign-in methods">
        <ul className="divide-line divide-y">
          {(googleEnabled || google) && (
            <MethodRow
              icon={<GoogleIcon className="size-5" />}
              name="Google"
              status={google ? "Connected" : "Not connected"}
            >
              {google ? (
                canRemoveOne && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectGoogle(google.id)}
                  >
                    Disconnect
                  </Button>
                )
              ) : (
                <Button variant="outline" size="sm" onClick={connectGoogle}>
                  Connect
                </Button>
              )}
            </MethodRow>
          )}
          <MethodRow
            icon={<IconKey className="size-5" />}
            name="Password"
            status={hasPassword ? "Set" : "Not set"}
          >
            {hasPassword ? (
              <>
                {canRemoveOne && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPasswordDialog("remove")}
                  >
                    Remove
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordDialog("change")}
                >
                  Change
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordDialog("set")}
              >
                Add password
              </Button>
            )}
          </MethodRow>
        </ul>
      </Section>

      <Section title="Sessions">
        <SessionsSection currentSessionId={currentSessionId} />
      </Section>

      <Section title="Your data">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted max-w-md">
            A JSON copy of your links, profiles, bookmarks and pixels.
          </p>
          <Button
            variant="outline"
            disabled={exportData.isFetching}
            onClick={download}
          >
            <IconDownload /> {exportData.isFetching ? "Preparing…" : "Export"}
          </Button>
        </div>
      </Section>

      <Section title="Delete account">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted max-w-md">
            Removes your account and everything in it, for good.
          </p>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            Delete account
          </Button>
        </div>
      </Section>

      {passwordDialog && (
        <PasswordDialog
          key={passwordDialog}
          mode={passwordDialog}
          onClose={() => setPasswordDialog(null)}
        />
      )}
      {deleting && (
        <DeleteAccountDialog
          username={user.username ?? user.email}
          hasPassword={hasPassword}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-panel mb-4 rounded-2xl p-5 sm:p-6">
      <h2 className="display mb-4 text-[28px]">{title}</h2>
      {children}
    </section>
  );
}

function MethodRow({
  icon,
  name,
  status,
  children,
}: {
  icon: React.ReactNode;
  name: string;
  status: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="bg-bg grid size-10 place-items-center rounded-xl">
        {icon}
      </span>
      <div className="mr-auto">
        <p className="font-semibold">{name}</p>
        <p className="text-muted text-sm">{status}</p>
      </div>
      <div className="flex gap-2">{children}</div>
    </li>
  );
}
