"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { formatNumber, formatRelative, hostOf } from "~/lib/format";
import { parseUserAgent, type ParsedUserAgent } from "~/lib/user-agent";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type PixelEvent = RouterOutputs["spypixel"]["getClicks"][number];

const fullDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});
const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const KIND_NOTES: Partial<Record<ParsedUserAgent["kind"], string>> = {
  "email-proxy":
    "Loaded through the mail provider's image proxy, so the IP and device are the provider's, not the reader's. It still means the email was opened.",
  bot: "A link preview or automated request, probably not a person.",
};

/** Every load of one pixel, newest first. Expand a row for everything recorded. */
export default function PixelEventsDialog({
  pixel,
  onClose,
}: {
  pixel: { id: string; name: string };
  onClose: () => void;
}) {
  const events = api.spypixel.getClicks.useQuery({ id: pixel.id });
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = events.data ?? [];
  const uniqueIps = new Set(list.map((e) => e.ipAddress).filter(Boolean)).size;
  const first = list.at(-1)?.createdAt;
  const last = list[0]?.createdAt;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{pixel.name}</DialogTitle>
        </DialogHeader>

        {list.length === 0 ? (
          <p className="text-muted py-8 text-center">
            {events.isPending ? "Loading…" : "No loads yet."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Stat label="Loads" value={formatNumber(list.length)} />
              <Stat label="Unique IPs" value={formatNumber(uniqueIps)} />
              <Stat
                label="Last load"
                value={last ? formatRelative(last) : "–"}
                small
              />
              <Stat
                label="First load"
                value={first ? shortDate.format(first) : "–"}
                small
              />
            </div>

            <ul className="divide-line bg-bg divide-y rounded-xl">
              {list.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  open={expanded === event.id}
                  onToggle={() =>
                    setExpanded(expanded === event.id ? null : event.id)
                  }
                />
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-bg rounded-xl px-3.5 py-3">
      <p
        className={cn(
          "display leading-none",
          small ? "pt-1 text-lg" : "text-[34px]",
        )}
      >
        {value}
      </p>
      <p className="text-muted mt-1 text-xs">{label}</p>
    </div>
  );
}

function EventRow({
  event,
  open,
  onToggle,
}: {
  event: PixelEvent;
  open: boolean;
  onToggle: () => void;
}) {
  const ua = parseUserAgent(event.userAgent);
  const country = event.headers?.["cf-ipcountry"];
  const clientLabel =
    [ua.client, ua.os].filter(Boolean).join(" · ") || "Unknown client";

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="hover:bg-panel grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm sm:grid-cols-[150px_minmax(0,1fr)_150px_minmax(0,160px)_auto]"
      >
        <span>
          <span className="block font-semibold">
            {formatRelative(event.createdAt)}
          </span>
          <span className="text-muted block text-xs">
            {fullDate.format(event.createdAt)}
          </span>
        </span>
        <IconChevronDown
          className={cn(
            "text-faint size-4 transition-transform sm:order-last",
            open && "rotate-180",
          )}
        />
        <span className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
          <span className="truncate">{clientLabel}</span>
          {ua.kind === "email-proxy" && <Tag>Mail proxy</Tag>}
          {ua.kind === "bot" && <Tag>Bot</Tag>}
        </span>
        <span className="text-muted col-span-2 truncate font-mono text-[13px] sm:col-span-1">
          {event.ipAddress ?? "No IP"}
          {country && ` · ${country}`}
        </span>
        <span className="text-muted col-span-2 truncate sm:col-span-1">
          {event.referer ? hostOf(event.referer) : "No referrer"}
        </span>
      </button>

      {open && <EventDetails event={event} ua={ua} country={country} />}
    </li>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="display bg-raised text-muted shrink-0 rounded-full px-2 pt-0.5 text-xs">
      {children}
    </span>
  );
}

function EventDetails({
  event,
  ua,
  country,
}: {
  event: PixelEvent;
  ua: ParsedUserAgent;
  country: string | undefined;
}) {
  const headers = Object.entries(event.headers ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const note = KIND_NOTES[ua.kind];

  return (
    <div className="bg-panel/60 px-4 pt-1 pb-4">
      {note && (
        <p className="bg-raised text-muted mb-3 rounded-lg px-3 py-2 text-sm">
          {note}
        </p>
      )}
      <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[130px_minmax(0,1fr)]">
        <Detail label="Time">
          {fullDate.format(event.createdAt)}
          <span className="text-muted ml-2 font-mono text-xs">
            {event.createdAt.toISOString()}
          </span>
        </Detail>
        <Detail label="IP address" mono>
          {event.ipAddress ?? "Not recorded"}
        </Detail>
        {country && <Detail label="Country">{country}</Detail>}
        <Detail label="Referrer" mono={!!event.referer}>
          {event.referer ?? (
            <span className="text-muted">
              None sent. Normal for mail apps and strict privacy settings.
            </span>
          )}
        </Detail>
        <Detail label="Client">
          {ua.client ?? "Unknown"}
          {ua.os && ` on ${ua.os}`}
          {ua.device !== "Unknown" && (
            <span className="text-muted"> · {ua.device}</span>
          )}
        </Detail>
        <Detail label="User agent" mono>
          {event.userAgent ?? "None sent"}
        </Detail>
        {headers.length > 0 && (
          <Detail label="Headers">
            <table className="w-full font-mono text-xs">
              <tbody className="divide-line divide-y">
                {headers.map(([name, value]) => (
                  <tr key={name} className="align-top">
                    <td className="text-muted py-1 pr-4 whitespace-nowrap">
                      {name}
                    </td>
                    <td className="py-1 break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Detail>
        )}
      </dl>
    </div>
  );
}

function Detail({
  label,
  mono = false,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="display text-muted pt-0.5 text-base">{label}</dt>
      <dd
        className={cn(
          "min-w-0",
          mono ? "font-mono text-[13px] break-all" : "break-words",
        )}
      >
        {children}
      </dd>
    </>
  );
}
