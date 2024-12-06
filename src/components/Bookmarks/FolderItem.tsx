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
import { EditDialog } from "./EditDialog";

type FolderProps = {
  icon: React.ReactNode;
  bgColor: string;
  onClick: () => void;
} & (
  | { folder: BookmarkFolder; parentFolderId?: never }
  | { parentFolderId: string; folder?: never }
);

const FolderItem = ({
  folder,
  icon,
  bgColor,
  onClick,
  parentFolderId,
}: FolderProps) => {
  const utils = api.useUtils();
  const deleteFolderMutation = api.bookmarks.deleteFolder.useMutation();
  const moveItemMutation = api.bookmarks.moveItem.useMutation();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFolderClick = async (e: React.MouseEvent) => {
    if (!e.target || (e.target as HTMLElement).id !== "folder-" + folder?.id)
      return;
    onClick();
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const targetFolderId = folder ? folder.id : parentFolderId;
    if (!targetFolderId) return;

    const type = e.dataTransfer.getData("type");
    if (!type) return;

    if (type === "bookmark") {
      const bookmarkId = e.dataTransfer.getData("bookmarkId");
      if (!bookmarkId) return;

      moveItemMutation.mutate(
        { bookmarkIds: [bookmarkId], targetFolderId },
        {
          onSuccess: () => {
            toast.success("Bookmark moved successfully", ToastOptions);
            utils.bookmarks.getFolder.invalidate().catch(console.error);
            utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
          },
          onError: (error) => {
            toast.error("Failed to move bookmark", ToastOptions);
            console.error(error);
          },
        },
      );
    } else if (type === "folder") {
      const draggedFolderId = e.dataTransfer.getData("folderId");
      if (!draggedFolderId) return;

      if (draggedFolderId === targetFolderId) {
        // toast.error("Cannot move a folder into itself!", ToastOptions);
        return;
      }

      moveItemMutation.mutate(
        { folderIds: [draggedFolderId], targetFolderId },
        {
          onSuccess: () => {
            toast.success("Folder moved successfully", ToastOptions);
            utils.bookmarks.getFolder.invalidate().catch(console.error);
            utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
          },
          onError: (error) => {
            toast.error("Failed to move folder", ToastOptions);
            console.error(error);
          },
        },
      );
    }
  };

  const editBtn = () => {
    setIsEditDialogOpen(true);
  };

  const deleteBtn = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!folder) return;
    deleteFolderMutation.mutate(
      { folderId: folder.id },
      {
        onSuccess: () => {
          toast.success("Folder deleted", ToastOptions);
          setIsDeleteDialogOpen(false);
          utils.bookmarks.getFolder.invalidate().catch(console.error);
          utils.bookmarks.getAllBookmarks.invalidate().catch(console.error);
        },
        onError: (error) => {
          toast.error("Failed to delete Folder", ToastOptions);
          console.error(error);
          setIsDeleteDialogOpen(false);
        },
      },
    );
  };

  const isDraggable = !!folder;

  const onDragStart = (e: React.DragEvent) => {
    if (!folder) return;
    setIsDragging(true);
    e.dataTransfer.setData("type", "folder");
    e.dataTransfer.setData("folderId", folder.id);

    const draggedElement = e.currentTarget as HTMLElement;
    const rect = draggedElement.getBoundingClientRect();
    const clone = draggedElement.cloneNode(true) as HTMLElement;

    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    document.body.appendChild(clone);

    e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);

    setTimeout(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }, 0);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div
        className={`group relative flex h-20 flex-1 cursor-pointer gap-5 rounded-xl border p-2.5 transition-colors duration-200 ${
          isDropdownOpen
            ? "border-zinc-600 bg-zinc-800"
            : isDragging
              ? "border-purple-700 bg-purple-700/30"
              : isDragOver
                ? "border-dashed border-blue-500 bg-blue-900/30"
                : // default
                  "border-zinc-900 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800"
        }`}
        onClick={handleFolderClick}
        id={"folder-" + folder?.id}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className={`pointer-events-none aspect-square h-full rounded-lg bg-opacity-20 p-3`}
          style={{ backgroundColor: bgColor }}
        >
          {icon}
        </div>
        <div className="pointer-events-none flex flex-col">
          <h4 className="text-lg font-medium">{folder?.name ?? "Go Back"}</h4>
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
                <DropdownMenuItem onClick={editBtn}>Edit</DropdownMenuItem>
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
              className="form_btn_white"
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="form_btn_red"
            >
              Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {folder?.parentFolderId && (
        <>
          <EditDialog
            isOpen={isEditDialogOpen}
            setIsOpen={setIsEditDialogOpen}
            isFolder={true}
            id={folder.id}
            initialName={folder.name}
            initialColor={folder.color}
            initialFolderId={folder.parentFolderId}
          />
        </>
      )}
    </>
  );
};

export default FolderItem;
