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
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SelectItems, type AllBookmarks } from "./SelectItems";

interface EditDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isFolder: boolean;
  id: string; // folderId or bookmarkId
  initialName: string;
  initialColor: string;
  initialUrl?: string; // only for bookmarks
  initialFolderId: string;
}

const EditDialog = ({
  isOpen,
  setIsOpen,
  isFolder,
  id,
  initialName,
  initialColor,
  initialUrl,
  initialFolderId,
}: EditDialogProps) => {
  const utils = api.useUtils();
  const editBookmarkMutation = api.bookmarks.editBookmark.useMutation();
  const editFolderMutation = api.bookmarks.editFolder.useMutation();
  const allBookmarks = api.bookmarks.getAllBookmarks.useQuery();

  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [folderId, setFolderId] = useState<string>(initialFolderId);

  useEffect(() => {
    setName(initialName);
    setColor(initialColor);
    if (!isFolder && initialUrl) {
      setUrl(initialUrl);
    }
  }, [isOpen, initialName, initialColor, initialUrl, isFolder]);

  const handleSave = () => {
    if (!name || !color || (!isFolder && !url)) {
      toast.error("Please fill out all fields", ToastOptions);
      return;
    }

    if (isFolder) {
      editFolderMutation.mutate(
        { folderId: id, newName: name, newColor: color, newFolderId: folderId },
        {
          onSuccess: () => {
            toast.success("Folder edited successfully", ToastOptions);
            setIsOpen(false);
            utils.bookmarks.getFolder.invalidate().catch(console.error);
            utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
          },
          onError: (error) => {
            toast.error("Failed to edit folder", ToastOptions);
            console.error(error);
          },
        },
      );
    } else {
      editBookmarkMutation.mutate(
        {
          bookmarkId: id,
          newName: name,
          newUrl: url,
          newColor: color,
          newFolderId: folderId 
        },

        {
          onSuccess: () => {
            toast.success("Bookmark edited successfully", ToastOptions);
            setIsOpen(false);
            utils.bookmarks.getFolder.invalidate().catch(console.error);
            utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
          },
          onError: (error) => {
            toast.error("Failed to edit bookmark", ToastOptions);
            console.error(error);
          },
        },
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setName(initialName);
          setColor(initialColor);
          setUrl(initialUrl ?? "");
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isFolder ? "Edit Folder" : "Edit Bookmark"}
          </DialogTitle>
          <DialogDescription>
            {isFolder
              ? "Edit your folder details"
              : "Edit your bookmark details"}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {!isFolder && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                className="col-span-3"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Input
              id="color"
              className="col-span-3"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Folder</Label>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value)}
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
          <Button variant="default" onClick={() => setIsOpen(false)} className="form_btn_white">
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave} className="form_btn_blue">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { EditDialog };
