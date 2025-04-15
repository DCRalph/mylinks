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

import { SelectItems } from "./SelectItems";

import { useEffect, useState } from "react";
import { type Bookmark } from "@prisma/client";
interface BookmarkItemProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentFolderId: string;
  editingBookmark: Bookmark | null;
}

const AddBookmark = ({
  isOpen,
  setIsOpen,
  currentFolderId,
  editingBookmark,
}: BookmarkItemProps) => {
  const utils = api.useUtils();
  const allBookmarks = api.bookmarks.getAllBookmarks.useQuery(undefined, {
    enabled: isOpen,
  });

  const addBookmarkMutation = api.bookmarks.createBookmark.useMutation();
  const editBookmarkMutation = api.bookmarks.editBookmark.useMutation();

  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [newBookmarkUrl, setNewBookmarkUrl] = useState("");
  const [newBookmarkColor, setNewBookmarkColor] = useState("#000000");

  const [newBookmarkFolderId, setNewBookmarkFolderId] = useState<
    string | undefined
  >(currentFolderId);

  const isEditing = !!editingBookmark;

  // Load editing data when available
  useEffect(() => {
    if (editingBookmark) {
      setNewBookmarkName(editingBookmark.name ?? "");
      setNewBookmarkUrl(editingBookmark.url);
      setNewBookmarkColor(editingBookmark.color);
      setNewBookmarkFolderId(editingBookmark.folderId);
    } else {
      // Reset fields when not editing
      setNewBookmarkName("");
      setNewBookmarkUrl("");
      setNewBookmarkColor("#000000");
      setNewBookmarkFolderId(currentFolderId);
    }
  }, [editingBookmark, currentFolderId]);

  const handleAddBookmark = () => {
    if (!newBookmarkName || !newBookmarkUrl || !newBookmarkFolderId) {
      toast.error("Please fill out all fields", ToastOptions);
      return;
    }

    if (isEditing && editingBookmark) {
      // Update existing bookmark
      editBookmarkMutation.mutate(
        {
          bookmarkId: editingBookmark.id,
          newName: newBookmarkName,
          newUrl: newBookmarkUrl,
          newColor: newBookmarkColor,
          newFolderId: newBookmarkFolderId,
        },
        {
          onSuccess: () => {
            toast.success("Bookmark updated", ToastOptions);
            setIsOpen(false);
            void utils.bookmarks.getFolder.invalidate();
            void utils.bookmarks.getAllBookmarks.invalidate();
          },
          onError: (error) => {
            toast.error("Failed to update bookmark", ToastOptions);
            console.error(error);
          },
        },
      );
    } else {
      // Add new bookmark
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
            setIsOpen(false);
            void utils.bookmarks.getFolder.invalidate();
            void utils.bookmarks.getAllBookmarks.invalidate();
          },
          onError: (error) => {
            toast.error("Failed to add bookmark", ToastOptions);
            console.error(error);
          },
        },
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        // Only reset if we're closing the dialog
        if (!isOpen && !editingBookmark) {
          setNewBookmarkName("");
          setNewBookmarkUrl("");
          setNewBookmarkFolderId(currentFolderId);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} bookmark</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edit an existing" : "Add a new"} bookmark to your
            collection
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
                      folder={allBookmarks.data}
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
            {isEditing ? "Save changes" : "Add bookmark"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookmark;
