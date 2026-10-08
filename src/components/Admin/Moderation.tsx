"use client";

import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";

import ConfirmDelete from "~/components/ConfirmDelete";
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
import { cn } from "~/lib/utils";

// Shared pieces of Admin → Links and Admin → Profiles.

export type ListQuery = {
  search: string;
  filter: "all" | "off";
  sort: "newest" | "top";
};

/** Search plus All/Turned off and Newest/Top toggles. */
export function Toolbar({
  label,
  query,
  onChange,
}: {
  label: string;
  query: ListQuery;
  onChange: (query: ListQuery) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <label className="relative block w-full max-w-sm">
        <IconSearch className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          className="h-10 pl-10"
          placeholder={label}
          aria-label={label}
          value={query.search}
          onChange={(e) => onChange({ ...query, search: e.target.value })}
        />
      </label>
      <Toggle
        options={[
          ["all", "All"],
          ["off", "Turned off"],
        ]}
        value={query.filter}
        onChange={(filter) => onChange({ ...query, filter })}
      />
      <Toggle
        options={[
          ["newest", "Newest"],
          ["top", "Top"],
        ]}
        value={query.sort}
        onChange={(sort) => onChange({ ...query, sort })}
      />
    </div>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="border-line flex rounded-xl border-[1.5px] p-0.5">
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "display h-8 cursor-pointer rounded-lg px-3 text-base",
            value === option ? "bg-ink text-bg" : "text-muted hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Turn off (asks for a reason), turn back on, or delete. */
export function Actions({
  what,
  name,
  disabled,
  pending,
  onTurnOff,
  onTurnOn,
  onDelete,
}: {
  what: "link" | "profile";
  name: string;
  disabled: boolean;
  pending: boolean;
  onTurnOff: (reason: string) => void;
  onTurnOn: () => void;
  onDelete: () => void;
}) {
  const [asking, setAsking] = useState(false);

  return (
    <div className="flex shrink-0 gap-2">
      {disabled ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={onTurnOn}>
          Turn on
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setAsking(true)}
        >
          Turn off
        </Button>
      )}
      <ConfirmDelete
        size="sm"
        title={`Delete ${name}?`}
        description={`The ${what} and its stats are removed for good. To keep them, turn it off instead.`}
        pending={pending}
        onConfirm={onDelete}
      />
      {asking && (
        <TurnOffDialog
          what={what}
          name={name}
          onClose={() => setAsking(false)}
          onConfirm={(reason) => {
            onTurnOff(reason);
            setAsking(false);
          }}
        />
      )}
    </div>
  );
}

function TurnOffDialog({
  what,
  name,
  onClose,
  onConfirm,
}: {
  what: "link" | "profile";
  name: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turn off {name}</DialogTitle>
          <DialogDescription>
            Visitors see a “turned off” page instead. The owner sees your
            reason, and you can turn it back on later.
          </DialogDescription>
        </DialogHeader>
        <form
          id="turn-off-form"
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(reason.trim());
          }}
        >
          <Label htmlFor="turn-off-reason">Reason</Label>
          <Input
            id="turn-off-reason"
            required
            maxLength={200}
            placeholder={what === "link" ? "Phishing" : "Impersonation"}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="turn-off-form" variant="destructive">
            Turn off
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Turned off" chip with the reason on hover. */
export function OffChip({ reason }: { reason: string | null }) {
  return (
    <span
      title={reason ?? undefined}
      className="display bg-danger/15 text-danger shrink-0 rounded-full px-2 pt-0.5 text-sm"
    >
      Off
    </span>
  );
}
