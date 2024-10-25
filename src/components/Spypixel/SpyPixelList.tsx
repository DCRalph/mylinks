// SpyPixelList.tsx
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import SpyPixelDialog from "./SpyPixelDialog";
import { type SpyPixel } from "@prisma/client";
import Copy from "../copy";
import { env } from "~/env";

export default function SpyPixelList() {
  const mySpyPixels = api.spypixel.getAll.useQuery();
  const [selectedSpyPixel, setSelectedSpyPixel] = useState<SpyPixel | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const openDialog = (spyPixel: SpyPixel) => {
    setSelectedSpyPixel(spyPixel);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedSpyPixel(null);
    setDialogOpen(false);
  };

  return (
    <>
      {mySpyPixels.data?.length ? (
        <div className="grid gap-4">
          {mySpyPixels.data.map((spyPixel) => (
            <div key={spyPixel.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
              <span className="text-white font-medium">{spyPixel.name}</span>
              <div className="flex gap-4 items-center">
                <span className="break-all text-sm font-semibold md:text-lg select-all">
                  {`${env.NEXT_PUBLIC_DOMAIN}/img/${spyPixel.slug}`}
                </span>
                <Copy text={`${env.NEXT_PUBLIC_DOMAIN} /img/${spyPixel.slug}`} />
              </div>
              <Button variant="secondary" onClick={() => openDialog(spyPixel)}>Manage</Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center text-2xl">No spy pixels found.</p>
      )}

      {/* Dialog for managing spy pixel */}
      {selectedSpyPixel && (
        <SpyPixelDialog
          spyPixel={selectedSpyPixel}
          isOpen={isDialogOpen}
          onClose={closeDialog}
        />
      )}

    </>
  );
}
