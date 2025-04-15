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
import { SelectItems } from "./SelectItems";
import { type BookmarkFolder } from "@prisma/client";

interface BookmarkItemProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentFolderId: string;
  editingFolder: BookmarkFolder | null;
}

const AddFolder = ({
  isOpen,
  setIsOpen,
  currentFolderId,
  editingFolder,
}: BookmarkItemProps) => {
  const utils = api.useUtils();
  const allBookmarks = api.bookmarks.getAllBookmarks.useQuery(undefined, {
    enabled: isOpen,
  });

  const addFolderMutation = api.bookmarks.createFolder.useMutation();
  const editFolderMutation = api.bookmarks.editFolder.useMutation();

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#000000");
  const [newFolderFolderId, setNewFolderFolderId] = useState<
    string | undefined
  >(currentFolderId);

  const isEditing = !!editingFolder;

  // Load editing data when available
  useEffect(() => {
    if (editingFolder) {
      setNewFolderName(editingFolder.name);
      setNewFolderColor(editingFolder.color);
      setNewFolderFolderId(editingFolder.parentFolderId ?? undefined);
    } else {
      // Reset fields when not editing
      setNewFolderName("");
      setNewFolderColor("#000000");
      setNewFolderFolderId(currentFolderId);
    }
  }, [editingFolder, currentFolderId]);

  const handleSubmit = () => {
    if (!newFolderName || !newFolderFolderId) {
      toast.error("Please fill out all fields", ToastOptions);
      return;
    }

    if (isEditing && editingFolder) {
      // Update existing folder
      editFolderMutation.mutate(
        {
          folderId: editingFolder.id,
          newName: newFolderName,
          newColor: newFolderColor,
          newFolderId: newFolderFolderId,
        },
        {
          onSuccess: () => {
            toast.success("Folder updated", ToastOptions);
            setIsOpen(false);
            void utils.bookmarks.getFolder.invalidate();
            void utils.bookmarks.getAllBookmarks.invalidate();
          },
          onError: (error) => {
            toast.error("Failed to update folder", ToastOptions);
            console.error(error);
          },
        },
      );
    } else {
      // Add new folder
      addFolderMutation.mutate(
        {
          name: newFolderName,
          folderId: newFolderFolderId,
          color: newFolderColor,
        },
        {
          onSuccess: () => {
            toast.success("Folder added", ToastOptions);
            setIsOpen(false);
            void utils.bookmarks.getFolder.invalidate();
            void utils.bookmarks.getAllBookmarks.invalidate();
          },
          onError: (error) => {
            toast.error("Failed to add folder", ToastOptions);
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
        if (!isOpen && !editingFolder) {
          setNewFolderName("");
          setNewFolderFolderId(currentFolderId);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Add"} Folder</DialogTitle>
          <DialogDescription>
            {isEditing ? "Edit an existing" : "Add a new"} folder to your
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
            onClick={handleSubmit}
            className="form_btn_white"
          >
            {isEditing ? "Save changes" : "Add folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFolder;
