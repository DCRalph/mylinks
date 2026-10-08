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
import type { DecodedVisit, Fact } from "~/lib/decode-visit";
import type { UserAgentPart } from "~/lib/user-agent-parts";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type PixelEvent = RouterOutputs["spypixel"]["getClicks"][number];

const fullDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});
const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const KIND_NOTES: Partial<Record<DecodedVisit["kind"], string>> = {
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
  const { decoded } = event;
  const country = event.headers?.["cf-ipcountry"];

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
          <span className="truncate">{decoded.summary}</span>
          {decoded.kind === "email-proxy" && <Tag>Mail proxy</Tag>}
          {decoded.kind === "bot" && <Tag>Bot</Tag>}
        </span>
        <span className="text-muted col-span-2 truncate font-mono text-[13px] sm:col-span-1">
          {event.ipAddress ?? "No IP"}
          {country && ` · ${country}`}
        </span>
        <span className="text-muted col-span-2 truncate sm:col-span-1">
          {event.referer ? hostOf(event.referer) : "No referrer"}
        </span>
      </button>

      {open && <EventDetails event={event} />}
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

/**
 * The decoded answer up top (device, place, other facts), then the raw values
 * it came from, with each decoded header lit up and explained in place.
 */
function EventDetails({ event }: { event: PixelEvent }) {
  const { decoded } = event;
  const note = KIND_NOTES[decoded.kind];
  const extras = decoded.facts.filter((fact) => !fact.headline);
  const decodedFrom = (header: string) =>
    decoded.facts.filter((fact) => fact.from.includes(header));
  // The user agent has its own row above the table.
  const headers = Object.entries(event.headers ?? {})
    .filter(([name]) => name !== "user-agent")
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="bg-panel/60 px-4 pt-1 pb-4">
      {note && (
        <p className="bg-raised text-muted mt-2 rounded-lg px-3 py-2 text-sm">
          {note}
        </p>
      )}

      <div className="mb-4 grid gap-x-6 gap-y-3 border-b pt-3 pb-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="display text-[34px] leading-[1.15]">{decoded.title}</p>
          {decoded.subtitle && (
            <p className="text-muted mt-1">{decoded.subtitle}</p>
          )}
        </div>
        {decoded.place && (
          <div className="sm:text-right">
            <p className="display text-2xl leading-[1.15]">
              {decoded.place.title}
            </p>
            {decoded.place.subtitle && (
              <p className="text-muted mt-1">{decoded.place.subtitle}</p>
            )}
          </div>
        )}
      </div>

      {extras.length > 0 && (
        <dl className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {extras.map((fact) => (
            <div
              key={fact.label}
              className="bg-bg flex flex-col rounded-xl px-3 py-2.5"
            >
              <dt className="text-muted order-last mt-0.5 text-xs">
                {fact.label}
              </dt>
              <dd className="text-sm break-words">
                {fact.href ? (
                  <a
                    href={fact.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lime hover:underline"
                  >
                    {fact.value}
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
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
        <Detail label="Referrer" mono={!!event.referer}>
          {event.referer ?? (
            <span className="text-muted">
              None sent. Normal for mail apps and strict privacy settings.
            </span>
          )}
        </Detail>
        <Detail label="User agent" mono>
          {event.userAgent ?? "None sent"}
          {decoded.userAgentParts.length > 0 ? (
            <UserAgentParts parts={decoded.userAgentParts} />
          ) : (
            <Meaning facts={decodedFrom("user-agent")} />
          )}
        </Detail>
        {headers.length > 0 && (
          <Detail label="Headers">
            <table className="w-full font-mono text-xs">
              <tbody className="divide-line divide-y">
                {headers.map(([name, value]) => {
                  const facts = decodedFrom(name);
                  return (
                    <tr key={name} className="align-top">
                      <td
                        className={cn(
                          "py-1 pr-4 whitespace-nowrap sm:w-56",
                          facts.length > 0 ? "text-lime" : "text-muted",
                        )}
                      >
                        {name}
                      </td>
                      <td className="py-1 break-all">
                        {value}
                        <Meaning facts={facts} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Detail>
        )}
      </dl>
    </div>
  );
}

/** The user agent piece by piece, each part explained where it's known. */
function UserAgentParts({ parts }: { parts: UserAgentPart[] }) {
  return (
    <table className="mt-2 w-full text-xs">
      <tbody className="divide-line divide-y">
        {parts.map((part, i) => (
          <tr key={i} className="align-top">
            <td
              className={cn(
                "py-1 pr-4 break-all sm:w-56",
                part.meaning ? "text-lime" : "text-muted",
              )}
            >
              {part.token}
            </td>
            <td className="py-1 font-sans break-normal">
              {part.meaning && <span className="block">{part.meaning}</span>}
              {part.note && (
                <span className="text-faint block">{part.note}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** What a raw value decoded to, and any caveats, under the value itself. */
function Meaning({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;
  const notes = new Set(facts.flatMap((fact) => fact.note ?? []));
  return (
    <span className="mt-1 block font-sans text-xs break-normal">
      <span className="text-muted block">
        {facts.map((fact) => `${fact.label}: ${fact.value}`).join(" · ")}
      </span>
      {[...notes].map((note) => (
        <span key={note} className="text-faint block">
          {note}
        </span>
      ))}
    </span>
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
