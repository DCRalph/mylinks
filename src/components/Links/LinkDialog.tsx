"use client";

import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
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
import { hostOf, plural } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";
import type { TicketLink } from "./LinkTicket";

/**
 * Edit or delete a short link, with a way into its stats. Works for the owner
 * and for moderators (the link router allows both). Render with `key={link.id}`.
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

        <Link
          href={`/dashboard/links/${link.id}`}
          className="flex items-center justify-between gap-3 rounded-xl bg-bg p-4 hover:bg-raised"
        >
          <span>
            <span className="display text-xl">
              {plural(link._count.clicks, "click")}
            </span>
            {!!link.bots && (
              <span className="text-sm text-muted">
                {" "}
                · {plural(link.bots, "bot")}
              </span>
            )}
          </span>
          <span className="display flex items-center gap-1 text-lg text-muted">
            Stats <IconArrowRight className="size-5" />
          </span>
        </Link>

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
