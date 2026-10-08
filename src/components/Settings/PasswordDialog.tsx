"use client";

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
import { Field } from "~/components/ui/label";
import { api } from "~/trpc/react";

export type PasswordMode = "set" | "change" | "remove";

const COPY: Record<
  PasswordMode,
  { title: string; body: string; action: string }
> = {
  set: {
    title: "Add a password",
    body: "Sign in with your email and this password as well as Google.",
    action: "Add password",
  },
  change: {
    title: "Change password",
    body: "Other devices will be signed out.",
    action: "Change password",
  },
  remove: {
    title: "Remove password",
    body: "You'll sign in with Google only.",
    action: "Remove password",
  },
};

/** Add, change or remove the email + password sign-in. */
export default function PasswordDialog({
  mode,
  onClose,
}: {
  mode: PasswordMode;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const utils = api.useUtils();

  const onSuccess = async () => {
    toast.success(
      mode === "remove"
        ? "Password removed"
        : mode === "set"
          ? "Password added"
          : "Password changed",
    );
    onClose();
    await utils.user.getUser.invalidate();
  };
  const set = api.user.createPassword.useMutation({ onSuccess });
  const change = api.user.changePassword.useMutation({ onSuccess });
  const remove = api.user.removePassword.useMutation({ onSuccess });
  const mutation = { set, change, remove }[mode];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "remove" && next !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    if (mode === "set") set.mutate({ password: next });
    if (mode === "change")
      change.mutate({ currentPassword: current, newPassword: next });
    if (mode === "remove") remove.mutate({ currentPassword: current });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{COPY[mode].title}</DialogTitle>
          <DialogDescription>{COPY[mode].body}</DialogDescription>
        </DialogHeader>
        <form id="password-form" className="grid gap-4" onSubmit={submit}>
          {mode !== "set" && (
            <Field label="Current password" htmlFor="pw-current">
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>
          )}
          {mode !== "remove" && (
            <>
              <Field
                label="New password"
                htmlFor="pw-new"
                hint="At least 8 characters."
              >
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  autoFocus={mode === "set"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
              </Field>
              <Field
                label="Type it again"
                htmlFor="pw-confirm"
                error={mismatch ? "Passwords don't match" : null}
              >
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>
            </>
          )}
          {mutation.error && (
            <p className="text-danger text-sm">{mutation.error.message}</p>
          )}
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="password-form"
            variant={mode === "remove" ? "destructive" : "default"}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : COPY[mode].action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
