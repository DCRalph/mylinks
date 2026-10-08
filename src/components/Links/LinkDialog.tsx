"use client";

import { useState } from "react";
import { toast } from "sonner";

import ConfirmDelete from "~/components/ConfirmDelete";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, PrefixInput } from "~/components/ui/input";
import { Field } from "~/components/ui/label";
import {
  deviceType,
  formatNumber,
  formatRelative,
  hostOf,
} from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";
import type { TicketLink } from "./LinkTicket";

/**
 * Edit or delete a short link, with its recent clicks. Works for the owner and
 * for admins (the link router allows both). Render with `key={link.id}`.
 */
export default function LinkDialog({
  link,
  onClose,
}: {
  link: TicketLink;
  onClose: () => void;
}) {
  const [shareDomain] = useShareDomain();
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);
  const [slug, setSlug] = useState(link.slug);
  const utils = api.useUtils();
  const clicks = api.link.getClicks.useQuery({ id: link.id });

  const refresh = () =>
    Promise.all([
      utils.link.getMyLinks.invalidate(),
      utils.link.getStats.invalidate(),
      utils.admin.getUser.invalidate(),
    ]);

  const save = api.link.editLink.useMutation({
    onSuccess: async () => {
      toast.success("Link saved");
      onClose();
      await refresh();
    },
  });

  const remove = api.link.deleteLink.useMutation({
    onSuccess: async () => {
      toast.success("Link deleted");
      onClose();
      await refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit link</DialogTitle>
        </DialogHeader>

        <form
          id="link-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ id: link.id, name, url: url.trim(), slug: slug.trim() });
          }}
        >
          <Field label="Name" htmlFor="link-name">
            <Input
              id="link-name"
              value={name}
              placeholder={hostOf(url)}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Destination" htmlFor="link-url">
            <Input
              id="link-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label="Short link" htmlFor="link-slug">
            <PrefixInput
              id="link-slug"
              prefix={`${shareDomain.host}/`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          {save.error && (
            <p className="text-sm text-danger">{save.error.message}</p>
          )}
        </form>

        <section className="rounded-xl bg-bg p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="display text-xl">Recent clicks</h3>
            <span className="display text-xl text-muted">
              {formatNumber(link._count.clicks)} total
            </span>
          </div>
          {clicks.data?.clicks.length ? (
            <ul className="max-h-44 divide-y divide-line overflow-y-auto text-sm">
              {clicks.data.clicks.map((click) => (
                <li key={click.id} className="flex gap-3 py-2">
                  <span className="w-28 shrink-0 text-muted">
                    {formatRelative(click.createdAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {click.referer && click.referer !== "unknown"
                      ? hostOf(click.referer)
                      : "Direct"}
                  </span>
                  <span className="shrink-0 text-muted">
                    {deviceType(click.userAgent)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              {clicks.isPending ? "Loading…" : "No clicks yet."}
            </p>
          )}
        </section>

        <DialogFooter className="sm:justify-between">
          <ConfirmDelete
            title="Delete this link?"
            description={`${shareDomain.host}/${link.slug} will stop working.`}
            onConfirm={() => remove.mutate({ id: link.id })}
            pending={remove.isPending}
          />
          <Button type="submit" form="link-form" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
