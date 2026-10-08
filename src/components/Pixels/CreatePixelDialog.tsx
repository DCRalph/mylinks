"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";

export default function CreatePixelDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const [shareDomain] = useShareDomain();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const utils = api.useUtils();

  const create = api.spypixel.createSpyPixel.useMutation({
    onSuccess: async () => {
      toast.success("Pixel created");
      onClose();
      await utils.spypixel.getAll.invalidate();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New pixel</DialogTitle>
        </DialogHeader>
        <form
          id="pixel-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name, slug: slug.trim() });
          }}
        >
          <Field label="Name" htmlFor="px-name" hint="What you'll put it in.">
            <Input
              id="px-name"
              required
              autoFocus
              placeholder="October newsletter"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field
            label="Address"
            htmlFor="px-slug"
            hint="Leave empty for a random one."
          >
            <PrefixInput
              id="px-slug"
              prefix={`${shareDomain.host}/img/`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          {create.error && (
            <p className="text-danger text-sm">{create.error.message}</p>
          )}
        </form>
        <DialogFooter>
          <Button type="submit" form="pixel-form" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create pixel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
