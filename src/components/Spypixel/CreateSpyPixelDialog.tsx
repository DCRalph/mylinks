// CreateSpyPixelDialog.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";

interface CreateSpyPixelDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSpyPixelDialog({ isOpen, onClose }: CreateSpyPixelDialogProps) {
  const mySpyPixels = api.spypixel.getAll.useQuery();
  const createSpyPixel = api.spypixel.createSpyPixel.useMutation();
  const [newPixelName, setNewPixelName] = useState("");
  const [newPixelSlug, setNewPixelSlug] = useState("");

  const handleCreateSpyPixel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    createSpyPixel.mutate({
      name: newPixelName,
      slug: newPixelSlug,
    }, {
      onSuccess: () => {
        onClose();
        setNewPixelName("");
        setNewPixelSlug("");
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
          <DialogTitle>Create Spy Pixel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateSpyPixel}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={newPixelName} onChange={(e) => setNewPixelName(e.target.value)} />
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={newPixelSlug} onChange={(e) => setNewPixelSlug(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
            <Button variant="destructive" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
