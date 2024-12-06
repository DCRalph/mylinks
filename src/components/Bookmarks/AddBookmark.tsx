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

import { SelectItems, type AllBookmarks } from "./SelectItems";

import { useEffect, useState } from "react";

interface BookmarkItemProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentFolderId: string;
}

const AddBookmark = ({
  isOpen,
  setIsOpen,
  currentFolderId,
}: BookmarkItemProps) => {
  const utils = api.useUtils();
  const allBookmarks = api.bookmarks.getAllBookmarks.useQuery();

  const addBookmarkMutation = api.bookmarks.createBookmark.useMutation();

  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");
  const [newBookmarkColor, setNewBookmarkColor] = useState("#000000");

  const [newBookmarkFolderId, setNewBookmarkFolderId] = useState<
    string | undefined
  >(currentFolderId);

  useEffect(() => {
    setNewBookmarkFolderId(currentFolderId);
  }, [currentFolderId]);

  const handleAddBookmark = () => {
    if (!newBookmarkName || !newBookmarkUrl || !newBookmarkFolderId) {
      toast.error("Please fill out all fields", ToastOptions);
      return;
    }

    addBookmarkMutation.mutate(
      {
        name: newBookmarkName,
        url: newBookmarkUrl,
        folderId: newBookmarkFolderId,
        color: newBookmarkColor,
      },
      {
        onSuccess: () => {
          toast.success("Bookmark added", ToastOptions);

          setNewBookmarkName("");
          setNewBookmarkUrl("");
          setNewBookmarkFolderId(allBookmarks.data?.id);

          setIsOpen(false);
          utils.bookmarks.getFolder.invalidate().catch(console.error);
          utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
        },
        onError: (error) => {
          toast.error("Failed to add bookmark", ToastOptions);
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
        setNewBookmarkName("");
        setNewBookmarkUrl("");
        setNewBookmarkFolderId(currentFolderId);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add bookmark</DialogTitle>
          <DialogDescription>
            Add a new bookmark to your collection
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
              value={newBookmarkName}
              onChange={(e) => setNewBookmarkName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">
              Url
            </Label>
            <Input
              id="url"
              className="col-span-3"
              value={newBookmarkUrl}
              onChange={(e) => setNewBookmarkUrl(e.target.value)}
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
              value={newBookmarkColor}
              onChange={(e) => setNewBookmarkColor(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Folder</Label>
            <Select
              value={newBookmarkFolderId}
              onValueChange={(value) => setNewBookmarkFolderId(value)}
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
            className="form_btn_white"
            onClick={handleAddBookmark}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmark;
