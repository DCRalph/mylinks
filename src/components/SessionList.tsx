"use client";

import { IconDeviceDesktop, IconDeviceMobile } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { formatRelative } from "~/lib/format";
import { parseUserAgent } from "~/lib/user-agent";

export type SessionInfo = {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
};

/**
 * Signed-in devices, newest activity first. Used for your own sessions in
 * Settings and for anyone's in the admin console.
 */
export default function SessionList({
  sessions,
  currentId,
  onRevoke,
  revoking,
}: {
  sessions: SessionInfo[];
  /** Marked "This device" and can't be revoked here. */
  currentId?: string;
  /** Omit to show the list without sign-out buttons. */
  onRevoke?: (session: SessionInfo) => void;
  revoking?: string | null;
}) {
  if (sessions.length === 0) {
    return <p className="text-muted">Not signed in anywhere.</p>;
  }

  const sorted = [...sessions].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );

  return (
    <ul className="divide-line divide-y">
      {sorted.map((session) => {
        const ua = parseUserAgent(session.userAgent ?? null);
        const Icon =
          ua.device === "Mobile" || ua.device === "Tablet"
            ? IconDeviceMobile
            : IconDeviceDesktop;
        const current = session.id === currentId;

        return (
          <li
            key={session.id}
            className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span className="bg-bg grid size-10 shrink-0 place-items-center rounded-xl">
              <Icon className="size-5" />
            </span>
            <div className="mr-auto min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {[ua.client, ua.os].filter(Boolean).join(" on ") ||
                  "Unknown device"}
                {current && <Tag>This device</Tag>}
                {session.impersonatedBy && <Tag>Admin view</Tag>}
              </p>
              <p className="text-muted text-sm">
                {session.ipAddress ?? "No IP"} · active{" "}
                {formatRelative(new Date(session.updatedAt))} · signed in{" "}
                {formatRelative(new Date(session.createdAt))}
              </p>
            </div>
            {onRevoke && !current && (
              <Button
                variant="ghost"
                size="sm"
                disabled={revoking === session.token}
                onClick={() => onRevoke(session)}
              >
                Sign out
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="display bg-raised text-muted rounded-full px-2 pt-0.5 text-xs">
      {children}
    </span>
  );
}
