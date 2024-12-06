import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import ToastOptions from "~/utils/toastOptions";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { useEffect, useState } from "react";
import { SelectItems, type AllBookmarks } from "./SelectItems";

interface BookmarkItemProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentFolderId: string;
}

const AddFolder = ({
  isOpen,
  setIsOpen,
  currentFolderId,
}: BookmarkItemProps) => {
  const utils = api.useUtils();
  const allBookmarks = api.bookmarks.getAllBookmarks.useQuery();

  const addFolderMutatuion = api.bookmarks.createFolder.useMutation();

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#000000");
  const [newFolderFolderId, setNewFolderFolderId] = useState<
    string | undefined
  >(currentFolderId);

  useEffect(() => {
    setNewFolderFolderId(currentFolderId);
  }, [currentFolderId]);

  const handleAddBookmark = () => {
    if (!newFolderName || !newFolderFolderId) {
      toast.error("Please fill out all fields", ToastOptions);
      return;
    }

    addFolderMutatuion.mutate(
      {
        name: newFolderName,
        folderId: newFolderFolderId,
        color: newFolderColor,
      },
      {
        onSuccess: () => {
          toast.success("Folder added", ToastOptions);

          setNewFolderName("");
          setNewFolderFolderId(allBookmarks.data?.id);

          setIsOpen(false);
          utils.bookmarks.getFolder.invalidate().catch(console.error);
          utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
        },
        onError: (error) => {
          toast.error("Failed to add folder", ToastOptions);
          console.error(error);
        },
      },
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        setNewFolderName("");
        setNewFolderFolderId(currentFolderId);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Folder</DialogTitle>
          <DialogDescription>
            Add a new folder to your collection
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              className="col-span-3"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Input
              id="color"
              className="col-span-3"
              type="color"
              value={newFolderColor}
              onChange={(e) => setNewFolderColor(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Folder</Label>
            <Select
              value={newFolderFolderId}
              onValueChange={(value) => setNewFolderFolderId(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {allBookmarks.data && (
                  <>
                    <SelectItems
                      folder={allBookmarks.data as AllBookmarks}
                      depth={0}
                    />
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddBookmark}
            className="form_btn_white"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFolder;
