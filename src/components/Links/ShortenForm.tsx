"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input, PrefixInput } from "~/components/ui/input";
import { shareUrl } from "~/lib/domains";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";

/** The "paste a long URL" bar at the top of the links dashboard. */
export default function ShortenForm() {
  const [shareDomain] = useShareDomain();
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const utils = api.useUtils();

  const create = api.link.createLink.useMutation({
    onSuccess: async ({ link }) => {
      setUrl("");
      setSlug("");
      const short = shareUrl(shareDomain, link.slug);
      toast.success("Link ready", {
        description: short,
        action: {
          label: "Copy",
          onClick: () => void navigator.clipboard.writeText(short),
        },
      });
      await Promise.all([
        utils.link.getMyLinks.invalidate(),
        utils.link.getStats.invalidate(),
      ]);
    },
  });

  return (
    <form
      className="rounded-2xl bg-panel p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate({ name: "", url: url.trim(), slug: slug.trim() });
      }}
    >
      <h2 className="display mb-3 text-[22px]">Shorten a link</h2>
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
        <Input
          type="url"
          required
          placeholder="Paste a long URL"
          aria-label="Destination URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <PrefixInput
          prefix={`${shareDomain.host}/`}
          placeholder="slug"
          aria-label="Custom slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending ? "…" : "Go"}
        </Button>
      </div>
      {create.error && (
        <p className="mt-2 text-sm text-danger">{create.error.message}</p>
      )}
    </form>
  );
}
