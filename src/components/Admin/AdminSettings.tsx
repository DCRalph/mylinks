"use client";

import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { Panel } from "./Panel";

type Settings = RouterOutputs["platform"]["settings"];

const RETENTION = [
  { value: 0, label: "Forever" },
  { value: 365, label: "1 year" },
  { value: 90, label: "90 days" },
] as const;

const IP_OPTIONS = [
  {
    value: "full",
    label: "Full",
    note: "Pixels show visitor IPs. Links and profiles use them for unique counts.",
  },
  {
    value: "trim",
    label: "Trim after 30 days",
    note: "After 30 days the last part is dropped (203.0.113.45 becomes 203.0.113.0), including IPs already stored.",
  },
  {
    value: "none",
    label: "Don't store",
    note: "New visits are stored without an IP, and IPs already stored are removed.",
  },
] as const;

const LIMITS = [
  { key: "linksPerHour", label: "Links an hour" },
  { key: "profilesPerDay", label: "Profiles a day" },
  { key: "pixelsPerDay", label: "Pixels a day" },
] as const;

/** /admin/settings: platform-wide switches, saved together. */
export default function AdminSettings() {
  const [saved] = api.platform.settings.useSuspenseQuery();
  const utils = api.useUtils();
  // null until edited, so the form shows what's saved.
  const [draft, setDraft] = useState<Settings | null>(null);
  const settings = draft ?? saved;
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  const update = (patch: Partial<Settings>) =>
    setDraft({ ...settings, ...patch });

  const save = api.platform.saveSettings.useMutation({
    onSuccess: async (next) => {
      utils.platform.settings.setData(undefined, next);
      setDraft(null);
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="grid max-w-3xl gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(settings);
      }}
    >
      <Panel title="Accounts">
        <Rows>
          <Row
            title="New sign-ups"
            note="Off means only existing accounts can sign in."
          >
            <Switch
              aria-label="New sign-ups"
              checked={settings.signUps === "open"}
              onCheckedChange={(open) =>
                update({ signUps: open ? "open" : "closed" })
              }
            />
          </Row>
        </Rows>
      </Panel>

      <Panel title="Links">
        <Rows>
          <Row
            title="Reserved slugs"
            note="Nobody can claim these for a link or profile. App routes are always reserved."
            stacked
          >
            <TagList
              label="reserved slug"
              placeholder="help"
              values={settings.reservedSlugs}
              onChange={(reservedSlugs) => update({ reservedSlugs })}
            />
          </Row>
          <Row
            title="Blocked destinations"
            note="Short links can't point at URLs containing any of these words or domains."
            stacked
          >
            <TagList
              label="blocked destination"
              placeholder="bit.ly"
              values={settings.blockedUrls}
              onChange={(blockedUrls) => update({ blockedUrls })}
            />
          </Row>
        </Rows>
      </Panel>

      <Panel title="Data">
        <Rows>
          <Row title="Keep click history">
            <Segmented
              label="Keep click history"
              options={RETENTION}
              value={settings.clickRetentionDays}
              onChange={(clickRetentionDays) => update({ clickRetentionDays })}
            />
          </Row>
          <Row
            title="Visitor IP addresses"
            note={
              IP_OPTIONS.find((o) => o.value === settings.ipAddresses)?.note
            }
            stacked
          >
            <Segmented
              label="Visitor IP addresses"
              options={IP_OPTIONS}
              value={settings.ipAddresses}
              onChange={(ipAddresses) => update({ ipAddresses })}
            />
          </Row>
        </Rows>
      </Panel>

      <Panel title="Limits">
        <p className="text-muted -mt-2 mb-3.5 text-sm">
          The most each account can create. Admins aren&apos;t limited.
        </p>
        <Rows>
          {LIMITS.map((limit) => (
            <Row key={limit.key} title={limit.label}>
              <Input
                type="number"
                aria-label={limit.label}
                min={1}
                className="h-10 w-24 text-right"
                value={settings.limits[limit.key]}
                onChange={(e) =>
                  update({
                    limits: {
                      ...settings.limits,
                      [limit.key]: Math.max(
                        1,
                        Math.round(Number(e.target.value)),
                      ),
                    },
                  })
                }
              />
            </Row>
          ))}
        </Rows>
      </Panel>

      <div className="bg-bg sticky bottom-0 flex justify-end gap-2 py-3">
        {dirty && (
          <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
            Discard
          </Button>
        )}
        <Button type="submit" disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function Rows({ children }: { children: React.ReactNode }) {
  return <div className="divide-line divide-y">{children}</div>;
}

function Row({
  title,
  note,
  stacked = false,
  children,
}: {
  title: string;
  note?: string;
  /** Put the control under the text rather than beside it. */
  stacked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 py-3.5 first:pt-0 last:pb-0",
        stacked ? "flex-col" : "items-center justify-between",
      )}
    >
      <div>
        <p className="font-semibold">{title}</p>
        {note && <p className="text-muted text-sm">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="border-line flex w-fit flex-wrap rounded-xl border-[1.5px] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "display h-8 cursor-pointer rounded-lg px-3 text-base",
            value === option.value
              ? "bg-ink text-bg"
              : "text-muted hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Removable chips plus an input that adds on Enter or comma. */
function TagList({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const commit = () => {
    const value = input.trim().toLowerCase().replace(/,$/, "");
    if (value && !values.includes(value)) onChange([...values, value]);
    setInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="bg-raised flex items-center gap-1 rounded-lg py-0.5 pr-1 pl-2 font-mono text-[13px]"
        >
          {value}
          <button
            type="button"
            aria-label={`Remove ${value}`}
            className="text-faint hover:text-ink cursor-pointer"
            onClick={() => onChange(values.filter((v) => v !== value))}
          >
            <IconX className="size-3.5" />
          </button>
        </span>
      ))}
      <Input
        aria-label={`Add a ${label}`}
        placeholder={`Add, e.g. ${placeholder}`}
        className="h-8 w-44 font-mono text-[13px]"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}
