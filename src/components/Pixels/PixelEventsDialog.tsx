"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { deviceType, formatRelative, hostOf } from "~/lib/format";
import { api } from "~/trpc/react";

/** Every load of one pixel, newest first. */
export default function PixelEventsDialog({
  pixel,
  onClose,
}: {
  pixel: { id: string; name: string };
  onClose: () => void;
}) {
  const events = api.spypixel.getClicks.useQuery({ id: pixel.id });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{pixel.name}</DialogTitle>
        </DialogHeader>
        {!events.data?.length ? (
          <p className="text-muted py-8 text-center">
            {events.isPending ? "Loading…" : "No loads yet."}
          </p>
        ) : (
          <div className="bg-bg max-h-[60dvh] overflow-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg sticky top-0">
                <tr className="display text-muted text-base">
                  <th className="px-4 py-2.5 font-normal">When</th>
                  <th className="px-4 py-2.5 font-normal">IP</th>
                  <th className="px-4 py-2.5 font-normal">Device</th>
                  <th className="px-4 py-2.5 font-normal">From</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {events.data.map((event) => (
                  <tr key={event.id}>
                    <td
                      className="px-4 py-2.5 whitespace-nowrap"
                      title={event.createdAt.toLocaleString()}
                    >
                      {formatRelative(event.createdAt)}
                    </td>
                    <td className="text-muted px-4 py-2.5 font-mono text-[13px]">
                      {event.ipAddress ?? "–"}
                    </td>
                    <td
                      className="px-4 py-2.5 whitespace-nowrap"
                      title={event.userAgent ?? undefined}
                    >
                      {deviceType(event.userAgent)}
                    </td>
                    <td className="text-muted max-w-48 truncate px-4 py-2.5">
                      {event.referer ? hostOf(event.referer) : "Direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
