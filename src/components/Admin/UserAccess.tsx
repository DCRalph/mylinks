"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { authClient, unwrap } from "~/lib/auth-client";
import {
  can,
  parseRoles,
  roleInfo,
  roles,
  type RoleName,
} from "~/lib/permissions";
import { api } from "~/trpc/react";
import type { Viewer } from "./AdminUser";
import { Panel } from "./Panel";
import { isBanned } from "./RoleChips";
import { sessionsKey } from "./UserSessions";

type AccessUser = {
  id: string;
  name: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
};

const ROLE_ORDER = Object.keys(roles) as RoleName[];

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** Roles and ban state, side by side. */
export default function UserAccess({
  user,
  viewer,
  locked,
}: {
  user: AccessUser;
  viewer: Viewer;
  /** Viewing yourself, or staff as a moderator: show, don't change. */
  locked: boolean;
}) {
  const utils = api.useUtils();
  const refresh = () =>
    Promise.all([
      utils.admin.getUser.invalidate(),
      utils.admin.getUsers.invalidate(),
    ]);
  const onError = (error: Error) => toast.error(error.message);

  const held = new Set(parseRoles(user.role));
  const setRoles = useMutation({
    mutationFn: (next: RoleName[]) =>
      unwrap(authClient.admin.setRole({ userId: user.id, role: next })),
    onSuccess: refresh,
    onError,
  });
  const toggle = (role: RoleName, on: boolean) => {
    const next = new Set(held).add("user");
    if (on) next.add(role);
    else next.delete(role);
    setRoles.mutate(ROLE_ORDER.filter((name) => next.has(name)));
  };

  const [banning, setBanning] = useState(false);
  const unban = useMutation({
    mutationFn: () => unwrap(authClient.admin.unbanUser({ userId: user.id })),
    onSuccess: async () => {
      toast.success(`${user.name} can sign in again`);
      await refresh();
    },
    onError,
  });

  const canSetRoles = !locked && can(viewer, { user: ["set-role"] });
  const canBan = !locked && can(viewer, { user: ["ban"] });
  const banned = isBanned(user);

  return (
    <div className="mb-3.5 grid gap-3.5 md:grid-cols-2">
      <Panel title="Roles">
        <ul className="divide-line divide-y">
          {ROLE_ORDER.filter((role) => role !== "user").map((role) => (
            <li key={role}>
              <label className="flex items-center justify-between gap-4 py-2.5">
                <span>
                  <span className="block font-semibold">
                    {roleInfo[role].label}
                  </span>
                  <span className="text-muted text-sm">
                    {roleInfo[role].description}
                  </span>
                </span>
                <Switch
                  checked={held.has(role)}
                  disabled={!canSetRoles || setRoles.isPending}
                  onCheckedChange={(on) => toggle(role, on)}
                />
              </label>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Status"
        action={
          canBan &&
          (banned ? (
            <Button
              size="sm"
              variant="outline"
              disabled={unban.isPending}
              onClick={() => unban.mutate()}
            >
              Unban
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBanning(true)}
            >
              Ban
            </Button>
          ))
        }
      >
        {banned ? (
          <>
            <p className="text-danger font-semibold">
              Banned{" "}
              {user.banExpires
                ? `until ${dateFormat.format(user.banExpires)}`
                : "indefinitely"}
            </p>
            <p className="text-muted mt-1 text-sm">
              {user.banReason
                ? `Reason: ${user.banReason}`
                : "No reason given."}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">Active</p>
            <p className="text-muted mt-1 text-sm">
              Banning signs them out everywhere and stops them signing back in.
              Their links keep working.
            </p>
          </>
        )}
      </Panel>

      {banning && (
        <BanDialog
          user={user}
          onClose={() => setBanning(false)}
          onBanned={refresh}
        />
      )}
    </div>
  );
}

const DURATIONS = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "forever", label: "Until unbanned" },
];

function BanDialog({
  user,
  onClose,
  onBanned,
}: {
  user: { id: string; name: string };
  onClose: () => void;
  onBanned: () => Promise<unknown>;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("forever");

  const ban = useMutation({
    mutationFn: () =>
      unwrap(
        authClient.admin.banUser({
          userId: user.id,
          banReason: reason.trim() || undefined,
          banExpiresIn:
            duration === "forever"
              ? undefined
              : Number(duration) * 24 * 60 * 60,
        }),
      ),
    onSuccess: async () => {
      toast.success(`${user.name} is banned`);
      onClose();
      await Promise.all([
        onBanned(),
        queryClient.invalidateQueries({ queryKey: sessionsKey(user.id) }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban {user.name}</DialogTitle>
          <DialogDescription>
            They&apos;re signed out everywhere and can&apos;t sign back in until
            the ban ends.
          </DialogDescription>
        </DialogHeader>
        <form
          id="ban-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            ban.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="ban-reason">Reason</Label>
            <Input
              id="ban-reason"
              placeholder="Optional, for the audit log"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ban-duration">How long</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="ban-duration" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="ban-form"
            variant="destructive"
            disabled={ban.isPending}
          >
            {ban.isPending ? "Banning…" : "Ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
