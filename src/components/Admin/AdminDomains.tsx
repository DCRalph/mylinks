"use client";

import { IconCheck, IconDots } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import ConfirmDelete from "~/components/ConfirmDelete";
import CopyButton from "~/components/CopyButton";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { formatRelative } from "~/lib/format";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { Panel } from "./Panel";

type DomainRow = RouterOutputs["platform"]["domains"]["domains"][number];

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** /admin/domains: the hosts this site answers on, and connecting new ones. */
export default function AdminDomains() {
  const [{ domains, googleEnabled }] = api.platform.domains.useSuspenseQuery();
  const utils = api.useUtils();
  const refresh = () => utils.platform.domains.invalidate();
  const onError = (error: { message: string }) => toast.error(error.message);

  const firstUnfinished = domains.find((d) => d.status !== "active");
  const [selectedId, setSelectedId] = useState(firstUnfinished?.id ?? null);
  const selected = domains.find((d) => d.id === selectedId);
  const primary = domains.find((d) => d.primary);

  const [host, setHost] = useState("");
  const add = api.platform.addDomain.useMutation({
    onSuccess: async (domain) => {
      setHost("");
      setSelectedId(domain.id);
      await refresh();
    },
    onError,
  });
  const setPrimary = api.platform.setPrimaryDomain.useMutation({
    onSuccess: refresh,
    onError,
  });
  const disable = api.platform.disableDomain.useMutation({
    onSuccess: refresh,
    onError,
  });

  const counts = {
    active: domains.filter((d) => d.status === "active").length,
    pending: domains.filter((d) => d.status === "pending").length,
  };

  return (
    <div className="grid items-start gap-3.5 lg:grid-cols-[1.5fr_1fr]">
      <Panel
        title="Domains"
        action={
          <span className="text-muted text-sm">
            {counts.active} active
            {counts.pending > 0 && ` · ${counts.pending} pending`}
          </span>
        }
      >
        <ul className="divide-line -my-3 divide-y">
          {domains.map((domain) => (
            <li
              key={domain.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 py-3.5",
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedId(domain.id)}
                className="flex min-w-0 cursor-pointer items-center gap-2.5 text-left"
              >
                <span
                  className={cn(
                    "display truncate-display text-[28px] leading-[1.15]",
                    domain.status === "disabled" && "text-faint",
                    domain.id === selectedId && "underline underline-offset-4",
                  )}
                >
                  {domain.host}
                </span>
                <StatusChip domain={domain} />
              </button>
              <div className="flex items-center gap-1.5">
                {domain.status !== "active" && (
                  <VerifyButton domain={domain} size="sm" variant="outline" />
                )}
                {!domain.primary && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`More for ${domain.host}`}
                      >
                        <IconDots />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setSelectedId(domain.id)}
                      >
                        Setup steps
                      </DropdownMenuItem>
                      {domain.status === "active" && (
                        <>
                          <DropdownMenuItem
                            onSelect={() =>
                              setPrimary.mutate({ id: domain.id })
                            }
                          >
                            Make primary
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => disable.mutate({ id: domain.id })}
                          >
                            Turn off
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-muted col-span-2 text-[13px]">
                <DomainMeta domain={domain} />
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-3.5">
        <Panel title="Add a domain">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add.mutate({ host });
            }}
          >
            <Input
              aria-label="Domain"
              placeholder="go.example.com"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
            <Button type="submit" disabled={add.isPending}>
              Add
            </Button>
          </form>
          <p className="text-muted mt-3 text-sm">
            Every short link and profile works on every active domain.
          </p>
        </Panel>

        {selected && primary && (
          <SetupSteps
            key={selected.id}
            domain={selected}
            primaryHost={primary.host}
            googleEnabled={googleEnabled}
            onRemoved={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

function StatusChip({ domain }: { domain: DomainRow }) {
  const [label, style] = domain.primary
    ? ["Primary", "bg-lime text-lime-ink"]
    : domain.status === "active"
      ? ["Active", "bg-raised text-muted"]
      : domain.status === "pending"
        ? ["Pending", "bg-warn/15 text-warn"]
        : ["Off", "bg-raised text-faint"];
  return (
    <span
      className={cn(
        "display shrink-0 rounded-full px-2.5 pt-0.5 text-sm",
        style,
      )}
    >
      {label}
    </span>
  );
}

function DomainMeta({ domain }: { domain: DomainRow }) {
  if (domain.status === "active") {
    return (
      <>
        {domain.verifiedAt
          ? `Verified ${dateFormat.format(domain.verifiedAt)}`
          : "Active"}
        {domain.primary && " · used for sign-in links and new visitors"}
      </>
    );
  }
  if (domain.status === "disabled") {
    return <>Turned off · visitors see a “not connected” page</>;
  }
  return (
    <>
      Added {formatRelative(domain.createdAt)}
      {domain.checkError && (
        <span className="text-warn"> · {domain.checkError}</span>
      )}
    </>
  );
}

function VerifyButton({
  domain,
  ...props
}: { domain: DomainRow } & Pick<
  React.ComponentProps<typeof Button>,
  "size" | "variant"
>) {
  const utils = api.useUtils();
  const verify = api.platform.verifyDomain.useMutation({
    onSuccess: async ({ error }) => {
      if (error) toast.error(error);
      else toast.success(`${domain.host} is connected`);
      await utils.platform.domains.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Button
      {...props}
      disabled={verify.isPending}
      onClick={() => verify.mutate({ id: domain.id })}
    >
      {verify.isPending
        ? "Checking…"
        : domain.status === "disabled"
          ? "Turn on"
          : "Verify"}
    </Button>
  );
}

/** How to connect a domain, with what can be checked ticked off. */
function SetupSteps({
  domain,
  primaryHost,
  googleEnabled,
  onRemoved,
}: {
  domain: DomainRow;
  primaryHost: string;
  googleEnabled: boolean;
  onRemoved: () => void;
}) {
  const utils = api.useUtils();
  const remove = api.platform.removeDomain.useMutation({
    onSuccess: async () => {
      onRemoved();
      await utils.platform.domains.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const connected = domain.status === "active";
  const callback = `${domain.protocol}://${domain.host}/api/auth/callback/google`;

  return (
    <Panel title={domain.host}>
      <ol className="grid gap-3">
        <Step done n={1} title="Added here" />
        <Step done={connected} n={2} title="Point DNS at the site.">
          {domain.host === primaryHost
            ? "This is the primary domain."
            : `Add a CNAME record for ${domain.host} pointing to ${primaryHost}. On Cloudflare, keep it proxied.`}
        </Step>
        <Step
          done={connected}
          n={3}
          title="Route it to this app in your hosting"
        >
          so it gets HTTPS and reaches this server.
        </Step>
        {googleEnabled && (
          <Step n={4} title="Google sign-in:">
            add this redirect URI to the OAuth client in Google Cloud.
            <span className="bg-bg mt-2 flex items-center gap-2 rounded-[10px] py-1 pr-1 pl-3">
              <span className="text-ink min-w-0 flex-1 truncate font-mono text-[13px]">
                {callback}
              </span>
              <CopyButton value={callback} label="Copy redirect URI" />
            </span>
          </Step>
        )}
      </ol>

      {domain.status !== "active" && domain.checkError && (
        <p className="text-warn mt-4 text-sm">
          Last check {domain.checkedAt && formatRelative(domain.checkedAt)}:{" "}
          {domain.checkError}
        </p>
      )}

      {!domain.primary && (
        <div className="mt-5 flex flex-wrap gap-2">
          {!connected && <VerifyButton domain={domain} />}
          <ConfirmDelete
            label="Remove"
            title={`Remove ${domain.host}?`}
            description="Visitors on this domain will see a “not connected” page. Links keep working on your other domains."
            pending={remove.isPending}
            onConfirm={() => remove.mutate({ id: domain.id })}
          />
        </div>
      )}
    </Panel>
  );
}

function Step({
  n,
  title,
  done = false,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[22px_1fr] gap-x-2.5">
      <span
        className={cn(
          "grid size-[22px] place-items-center rounded-full text-xs font-bold",
          done ? "bg-lime text-lime-ink" : "bg-raised text-muted",
        )}
      >
        {done ? <IconCheck className="size-3.5" stroke={3} /> : n}
      </span>
      <p className="text-muted min-w-0 text-sm">
        <span className="text-ink font-semibold">{title}</span> {children}
      </p>
    </li>
  );
}
