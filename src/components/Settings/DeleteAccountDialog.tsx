"use client";

import { useState } from "react";

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
import { Field } from "~/components/ui/label";
import { authClient } from "~/lib/auth-client";
import { reloadTo } from "~/lib/utils";

/** Permanently delete the account. Needs the username typed out, and the password if there is one. */
export default function DeleteAccountDialog({
  username,
  hasPassword,
  onClose,
}: {
  username: string;
  hasPassword: boolean;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const result = await authClient.deleteUser(hasPassword ? { password } : {});
    if (result.error) {
      setError(
        result.error.code === "SESSION_EXPIRED"
          ? "For safety, sign out and back in, then try again."
          : (result.error.message ?? "Couldn't delete your account"),
      );
      setPending(false);
      return;
    }
    reloadTo("/");
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            Your links stop working and your profiles, bookmarks and pixels are
            deleted. This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <form id="delete-account" className="grid gap-4" onSubmit={submit}>
          <Field label={`Type ${username} to confirm`} htmlFor="del-username">
            <Input
              id="del-username"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </Field>
          {hasPassword && (
            <Field label="Password" htmlFor="del-password">
              <Input
                id="del-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          )}
          {error && <p className="text-danger text-sm">{error}</p>}
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="delete-account"
            variant="destructive"
            disabled={pending || typed !== username}
          >
            {pending ? "Deleting…" : "Delete everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
