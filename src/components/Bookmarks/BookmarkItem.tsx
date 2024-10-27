import { useState } from "react";
import { IconDotsVertical, IconExternalLink } from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Bookmark } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import ToastOptions from "~/utils/toastOptions";

interface BookmarkItemProps {
  bookmark: Bookmark;
  bgColor: string;
}

const BookmarkItem = ({ bookmark, bgColor }: BookmarkItemProps) => {
  const utils = api.useUtils();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deleteBookmarkMutation = api.bookmarks.deleteBookmark.useMutation();

  // trim the url to show only the domain
  let url;
  try {
    url = new URL(bookmark.url).hostname;
  } catch (e) {
    url = bookmark.url;
  }

  const openBookmark = (e: React.MouseEvent) => {
    // console.log(e);
    if (!e.target || (e.target as HTMLElement).id != "bookmark-" + bookmark.id)
      return;
    window.open(bookmark.url, "_blank");
  };

  const editBtn = () => {
    setIsEditDialogOpen(true);
  };

  const moveBtn = () => {
    setIsMoveDialogOpen(true);
  };

  const deleteBtn = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteBookmarkMutation.mutate(
      { bookmarkId: bookmark.id },
      {
        onSuccess: () => {
          toast.success("Bookmark deleted", ToastOptions);
          setIsDeleteDialogOpen(false);
          utils.bookmarks.getFolder.invalidate().catch(console.error);
        },
        onError: (error) => {
          toast.error("Failed to delete bookmark", ToastOptions);
          console.error(error);
          setIsDeleteDialogOpen(false);
        },
      },
    );
  };

  return (
    <>
      <div
        className={`group relative flex h-20 w-full flex-1 cursor-pointer gap-5 rounded-xl border p-2.5 transition-colors duration-200 ${
          isDropdownOpen
            ? "border-zinc-600 bg-zinc-800"
            : "border-zinc-900 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800"
        }`}
        onClick={(e: React.MouseEvent) => {
          openBookmark(e);
        }}
        id={"bookmark-" + bookmark.id}
      >
        <div
          className={`pointer-events-none aspect-square h-full rounded-lg bg-opacity-20 p-3`}
          style={{ backgroundColor: bgColor + "" }}
        >
          <IconExternalLink className="h-full w-full" />
        </div>
        <div className="pointer-events-none flex flex-col">
          <h4 className="text-lg font-medium">{bookmark.name}</h4>
          <p className="text-dark-200/70 text-sm dark:text-white/70">{url}</p>
        </div>
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
              <DropdownMenuLabel>Bookmark</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={editBtn}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={moveBtn}>Move</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={deleteBtn}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            Are you sure you want to delete this bookmark?
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

export default BookmarkItem;
