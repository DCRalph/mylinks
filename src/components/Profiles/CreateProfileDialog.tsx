"use client";

import { useRouter } from "next/navigation";
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
import { slugify } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";

/** Name a new profile, then jump to its editor. */
export default function CreateProfileDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const [shareDomain] = useShareDomain();
  const [name, setName] = useState("");
  // Follows the name until the slug is edited by hand.
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const slug = customSlug ?? slugify(name);

  const utils = api.useUtils();
  const create = api.profile.createProfile.useMutation({
    onSuccess: async ({ profile }) => {
      toast.success("Profile created");
      await utils.profile.getProfiles.invalidate();
      router.push(`/profiles/${profile.id}`);
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New profile</DialogTitle>
        </DialogHeader>
        <form
          id="create-profile"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({ name, altName: null, slug, bio: null });
          }}
        >
          <Field label="Name" htmlFor="np-name">
            <Input
              id="np-name"
              required
              autoFocus
              placeholder="William Giles"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Address" htmlFor="np-slug">
            <PrefixInput
              id="np-slug"
              required
              prefix={`${shareDomain.host}/p/`}
              value={slug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
          </Field>
          {create.error && (
            <p className="text-sm text-danger">{create.error.message}</p>
          )}
        </form>
        <DialogFooter>
          <Button type="submit" form="create-profile" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
