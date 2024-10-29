// SpyPixelDialog.tsx
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "~/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { env } from "~/env";
import { type SpyPixel } from "@prisma/client";
import Copy from "../copy";
import { useState } from "react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import SpyPixelEventsDialog from "./SpyPixelEventsDialog";


interface SpyPixelDialogProps {
  spyPixel: SpyPixel;
  isOpen: boolean;
  onClose: () => void;
}

export default function SpyPixelDialog({ spyPixel, isOpen, onClose }: SpyPixelDialogProps) {
  const mySpyPixels = api.spypixel.getAll.useQuery();
  const deleteSpyPixel = api.spypixel.deleteSpyPixel.useMutation();
  const clicks = api.spypixel.getClicks.useQuery({ id: spyPixel.id });
  const [isEventDialogOpen, setEventDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSpyPixel = async () => {
    if (!spyPixel) return;

    deleteSpyPixel.mutate({ id: spyPixel.id },
      {
        onSuccess: () => {
          onClose();
          setIsDeleting(false);
          mySpyPixels.refetch().then().catch((error: string) => {
            console.error(error);
          });
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        }
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{spyPixel.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p><strong>Slug:</strong> {spyPixel.slug}</p>
          <div className="flex gap-2">
            <p><strong>URL:</strong> {`${env.NEXT_PUBLIC_DOMAIN}/img/${spyPixel.slug}`}</p>
            <Copy text={`${env.NEXT_PUBLIC_DOMAIN}/img/${spyPixel.slug}`} />
          </div>
          <p><strong>Created At:</strong> {new Date(spyPixel.createdAt ?? '').toLocaleDateString()}</p>
          <p><strong>Events:</strong> {clicks.data?.length}</p>
        </div>
        {clicks.data && (
            <SpyPixelEventsDialog
              isOpen={isEventDialogOpen}
              setIsOpen={setEventDialogOpen}
              clicks={clicks.data}
            />
        )}
        <DialogFooter>
          <Button variant={"default"} onClick={() => { setEventDialogOpen(true) }}>Events</Button>
          <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="default" onClick={() => setIsDeleting(false)}>Cancel</Button>

                <Button variant="destructive" onClick={handleDeleteSpyPixel}>Confirm Delete</Button>
              </AlertDialogFooter>

            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>


    </Dialog>
  );
}
