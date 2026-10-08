"use client";

import { IconCode, IconList, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import ConfirmDelete from "~/components/ConfirmDelete";
import CopyButton from "~/components/CopyButton";
import Empty from "~/components/Empty";
import { Button } from "~/components/ui/button";
import { shareUrl } from "~/lib/domains";
import { formatNumber, formatRelative, plural } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api, type RouterOutputs } from "~/trpc/react";
import CreatePixelDialog from "./CreatePixelDialog";
import PixelEventsDialog from "./PixelEventsDialog";

type Pixel = RouterOutputs["spypixel"]["getAll"][number];

/** /pixels: tracking images and how often each has loaded. */
export default function PixelsBoard() {
  const [shareDomain] = useShareDomain();
  const pixels = api.spypixel.getAll.useQuery();
  const utils = api.useUtils();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Pixel | null>(null);

  const remove = api.spypixel.deleteSpyPixel.useMutation({
    onSuccess: async () => {
      toast.success("Pixel deleted");
      await utils.spypixel.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const all = pixels.data ?? [];

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[60px] leading-[1.15] sm:text-[96px]">
            Pixels
          </h1>
          <p className="text-muted mt-3 max-w-lg">
            An invisible image. Put it in an email or a page and see every time
            it loads.
          </p>
        </div>
        <Button size="lg" onClick={() => setCreating(true)}>
          <IconPlus /> New pixel
        </Button>
      </header>

      {all.length === 0 && !pixels.isPending ? (
        <Empty title="No pixels yet" />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {all.map((pixel) => {
            const url = shareUrl(shareDomain, `img/${pixel.slug}`);
            const lastLoad = pixel.clicks[0]?.createdAt;
            return (
              <article
                key={pixel.id}
                className="bg-panel flex flex-col gap-4 rounded-2xl p-5"
              >
                <div className="min-w-0">
                  <h2 className="display truncate-display text-[36px] leading-none">
                    {pixel.name}
                  </h2>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-lime truncate font-mono text-[13px]">
                      {shareDomain.host}/img/{pixel.slug}
                    </span>
                    <CopyButton
                      value={url}
                      label="Copy URL"
                      className="text-muted"
                    />
                    <CopyButton
                      value={`<img src="${url}" width="1" height="1" alt="" />`}
                      label="Copy HTML snippet"
                      icon={<IconCode />}
                      className="text-muted"
                    />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="display text-[44px] leading-none">
                      {formatNumber(pixel._count.clicks)}
                      <span className="ml-1.5 text-base">
                        {pixel._count.clicks === 1 ? "load" : "loads"}
                      </span>
                    </p>
                    <p className="text-muted mt-1 text-[13px]">
                      {lastLoad
                        ? `Last ${formatRelative(lastLoad)}`
                        : "Never loaded"}
                      {!!pixel.bots && ` · + ${plural(pixel.bots, "bot")}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ConfirmDelete
                      size="sm"
                      title="Delete this pixel?"
                      description="Its history goes too, and the image stops recording loads."
                      onConfirm={() => remove.mutate({ id: pixel.id })}
                      pending={remove.isPending}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewing(pixel)}
                    >
                      <IconList /> Events
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {creating && <CreatePixelDialog onClose={() => setCreating(false)} />}
      {viewing && (
        <PixelEventsDialog pixel={viewing} onClose={() => setViewing(null)} />
      )}
    </>
  );
}
