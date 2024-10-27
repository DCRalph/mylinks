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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { type Bookmark, type BookmarkFolder } from "@prisma/client";
import { useEffect, useState } from "react";

interface BookmarkItemProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentFolderId: string;
}

type AllBookmarks = BookmarkFolder & {
  bookmarks: Bookmark[];
  subfolders: AllBookmarks[];
};

const SelectItems = ({
  folder,
  depth,
}: {
  folder: AllBookmarks;
  depth: number;
}) => {
  const newDepth = depth + 1;

  return (
    <>
      <SelectItem value={folder.id}>
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-sm"
            style={{
              backgroundColor: folder.color,
              marginLeft: `${depth * 0.5}rem`,
            }}
          ></div>
          <span>{folder.name}</span>
        </div>
      </SelectItem>

      {folder.subfolders.map((subfolder) => (
        <SelectItems key={subfolder.id} folder={subfolder} depth={newDepth} />
      ))}
    </>
  );
};

const AddFolder = ({
  isOpen,
  setIsOpen,
  currentFolderId,
}: BookmarkItemProps) => {
  const utils = api.useUtils();
  const allBookmarks = api.bookmarks.getAllBookmarks.useQuery();

  const addFolderMutatuion = api.bookmarks.createFolder.useMutation();

  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [newBookmarkFolderId, setNewBookmarkFolderId] = useState<
    string | undefined
  >(currentFolderId);

  useEffect(() => {
    setNewBookmarkFolderId(currentFolderId);
  }, [currentFolderId]);

  const handleAddBookmark = () => {
    if (!newBookmarkName || !newBookmarkFolderId) {
      toast.error("Please fill out all fields", ToastOptions);
      return;
    }

    addFolderMutatuion.mutate(
      {
        name: newBookmarkName,
        folderId: newBookmarkFolderId,
      },
      {
        onSuccess: async () => {
          toast.success("Folder added", ToastOptions);

          setNewBookmarkName("");
          setNewBookmarkFolderId(allBookmarks.data?.id);

          setIsOpen(false);
          await utils.bookmarks.getFolder.invalidate().catch(console.error);
          await utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);

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
        setNewBookmarkName("");
        setNewBookmarkFolderId(currentFolderId);
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
              value={newBookmarkName}
              onChange={(e) => setNewBookmarkName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bookmark" className="text-right">
              Bookmark
            </Label>
            <Select
              value={newBookmarkFolderId}
              onValueChange={(value) => setNewBookmarkFolderId(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a bookmark" />
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
          <Button type="submit" onClick={handleAddBookmark}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFolder;
