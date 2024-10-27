// components/FolderItem.tsx
import { useState } from "react";

import { type BookmarkFolder } from "@prisma/client";
import { IconDotsVertical } from "@tabler/icons-react";

import { api } from "~/trpc/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { toast } from "react-toastify";
import ToastOptions from "~/utils/toastOptions";
interface FolderProps {
  folder?: BookmarkFolder;
  icon: React.ReactNode;
  bgColor: string;
  onClick: () => void;
}

const FolderItem = ({ folder, icon, bgColor, onClick }: FolderProps) => {
  const utils = api.useUtils();
  const deleteFolderMutation = api.bookmarks.deleteFolder.useMutation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleFolderClick = async (e: React.MouseEvent) => {
    // console.log(e);
    if (!e.target || (e.target as HTMLElement).id != "folder-" + folder?.id)
      return;
    onClick();
  };

  const editBtn = () => {
    // setIsEditDialogOpen(true);
  };

  const moveBtn = () => {
    // setIsMoveDialogOpen(true);
  };

  const deleteBtn = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (folder == null) return;
    deleteFolderMutation.mutate(
      { folderId: folder.id },
      {
        onSuccess:  () => {
          toast.success("Folder deleted", ToastOptions);
          setIsDeleteDialogOpen(false);
          utils.bookmarks.getFolder.invalidate().catch(console.error);
          utils.bookmarks.getAllBookmarks
            .invalidate()
            .catch(console.error);
        },
        onError: (error) => {
          toast.error("Failed to delete Folder", ToastOptions);
          console.error(error);
          setIsDeleteDialogOpen(false);
        },
      },
    );
  };

  return (
    <>
      <div
        className={`group relative flex h-20 flex-1 cursor-pointer gap-5 rounded-xl border p-2.5 transition-colors duration-200 ${
          isDropdownOpen
            ? "border-zinc-600 bg-zinc-800"
            : "border-zinc-900 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800"
        }`}
        onClick={handleFolderClick}
        id={"folder-" + folder?.id}
      >
        <div
          className={`pointer-events-none aspect-square h-full rounded-lg bg-opacity-20 p-3`}
          style={{ backgroundColor: bgColor }}
        >
          {icon}
        </div>
        <div className="pointer-events-none flex flex-col">
          <h4 className="text-lg font-medium">{folder?.name ?? "Go Back"}</h4>
          {/* <p className="text-dark-200/70 text-sm dark:text-white/70">
          {bookmark.url}
        </p> */}
        </div>
        {folder != null && (
          <div className="absolute right-2 top-2">
            <DropdownMenu onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`text-white transition-opacity ${
                    isDropdownOpen
                      ? "opacity-100"
                      : "opacity-50 group-hover:opacity-100"
                  } `}
                >
                  <IconDotsVertical />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Folder</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Move</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={deleteBtn}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this folder and all its contents?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button
              variant="default"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button variant="destructive" onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FolderItem;
