// app/bookmarks/page.tsx

"use client";

import { useState } from "react";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import { api } from "~/trpc/react";
import {
  IconArrowBackUp,
  IconBookmark,
  IconChevronRight,
  IconDotsVertical,
  IconFolderFilled,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconEdit,
  IconFolder,
} from "@tabler/icons-react";
import AddBookmark from "~/components/Bookmarks/AddBookmark";
import AddFolder from "~/components/Bookmarks/AddFolder";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import Image from "next/image";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  MeasuringStrategy,
  rectIntersection,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Define better types for bookmarks and folders to prevent linter errors
type BookmarkType = {
  id: string;
  url: string;
  name?: string;
  title?: string;
  image?: string;
  color: string;
  folderId: string;
  createdAt: Date;
  userId: string;
};

type FolderType = {
  id: string;
  name: string;
  color: string;
  parentFolderId: string | null;
  createdAt: Date;
  userId: string;
  type: string;
  _count?: {
    bookmarks: number;
    subfolders: number;
  };
};

type DragItemType = {
  id: string;
  type: "bookmark" | "folder";
  data: BookmarkType | FolderType;
};

export default function BookmarksPage() {
  const utils = api.useUtils();
  const myUser = api.user.getUser.useQuery();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const currentFolder = api.bookmarks.getFolder.useQuery({
    folderId: currentFolderId,
  });
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(
    null,
  );
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [activeItem, setActiveItem] = useState<DragItemType | null>(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Mutation for moving items
  const moveItemMutation = api.bookmarks.moveItem.useMutation({
    onSuccess: () => {
      void utils.bookmarks.getFolder.invalidate();
    },
  });

  const handleFolderClick = async (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const goBack = async () => {
    if (currentFolder?.data?.parentFolderId) {
      setCurrentFolderId(currentFolder.data?.parentFolderId);
    } else {
      setCurrentFolderId(null); // Go back to root
    }
  };

  // Delete a bookmark
  const deleteBookmarkMutation = api.bookmarks.deleteBookmark.useMutation({
    onSuccess: () => {
      void utils.bookmarks.getFolder.invalidate();
    },
  });

  // Delete a folder
  const deleteFolderMutation = api.bookmarks.deleteFolder.useMutation({
    onSuccess: () => {
      void utils.bookmarks.getFolder.invalidate();
    },
  });

  // Edit a bookmark
  const handleEditBookmark = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setAddBookmarkOpen(true);
  };

  // Edit a folder
  const handleEditFolder = (folder: FolderType) => {
    setEditingFolder(folder);
    setAddFolderOpen(true);
  };

  // Filter bookmarks based on search query
  const filteredBookmarks =
    (currentFolder.data?.bookmarks as BookmarkType[] | undefined)?.filter(
      (bookmark) =>
        (bookmark.name ?? bookmark.title ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  // Filter folders based on search query
  const filteredFolders =
    (currentFolder.data?.subfolders as FolderType[] | undefined)?.filter(
      (folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  // Draggable Folder Component
  const DraggableFolder = ({
    folder,
    onFolderClick,
    onEditFolder,
    onDeleteFolder,
  }: {
    folder: FolderType;
    onFolderClick: (id: string) => void;
    onEditFolder: (folder: FolderType) => void;
    onDeleteFolder: (id: string) => void;
  }) => {
    // Set up the sortable (draggable) behavior
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: folder.id,
      data: {
        type: "folder",
        id: folder.id,
        data: folder,
      },
    });

    // Set up the droppable behavior
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id: folder.id,
    });

    // Merge the two refs so that the same element is both draggable and droppable
    const combinedRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      setDroppableRef(node);
    };

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
      zIndex: isDragging ? 1 : 0,
    };

    return (
      <div
        {...attributes}
        {...listeners}
        ref={combinedRef}
        style={style}
        className="group/item relative h-full"
      >
        <div
          onClick={() => onFolderClick(folder.id)}
          className={`group relative h-full cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900 transition-all duration-300 hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50 ${
            isOver
              ? "!border-2 border-dashed !border-blue-500 !shadow-lg !shadow-blue-500/30"
              : ""
          }`}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${folder.color}15 0%, ${folder.color}30 100%)`,
            }}
          ></div>
          {/* Add blue tint effect when hovering for drop */}
          {isOver && (
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-blue-500/20 opacity-30"></div>
          )}
          <div className="flex h-full flex-col">
            <div className="flex items-center p-4">
              <div
                className="mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: folder.color,
                  boxShadow: `0 10px 15px -3px ${folder.color}30`,
                }}
              >
                <IconFolderFilled className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{folder.name}</h3>
                <p className="text-sm text-zinc-400">
                  {folder._count?.bookmarks ?? 0} bookmark
                  {folder._count?.bookmarks !== 1 ? "s" : ""} •{" "}
                  {folder._count?.subfolders ?? 0} folder
                  {folder._count?.subfolders !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Folder Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 p-0 text-zinc-400 opacity-0 backdrop-blur-sm transition-opacity hover:bg-zinc-700 hover:text-white group-hover/item:opacity-100"
            >
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 border border-zinc-700 bg-zinc-800 p-0 text-white">
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 focus:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onEditFolder(folder);
              }}
            >
              <IconEdit className="h-4 w-4" />
              Edit Folder
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 focus:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
            >
              <IconTrash className="h-4 w-4" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Draggable Bookmark Component
  const DraggableBookmark = ({
    bookmark,
    onEditBookmark,
    onDeleteBookmark,
  }: {
    bookmark: BookmarkType;
    onEditBookmark: (bookmark: BookmarkType) => void;
    onDeleteBookmark: (id: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: bookmark.id,
      data: {
        type: "bookmark",
        id: bookmark.id,
        data: bookmark,
      },
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
      zIndex: isDragging ? 1 : 0,
    };

    return (
      <div
        {...attributes}
        {...listeners}
        ref={setNodeRef}
        style={style}
        className="group/item relative h-full"
      >
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900 transition-all duration-300 hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${bookmark.color}15 0%, ${bookmark.color}30 100%)`,
            }}
          ></div>

          {bookmark.image ? (
            <div className="aspect-video w-full overflow-hidden">
              <Image
                src={bookmark.image}
                alt={bookmark.title ?? bookmark.name ?? "Bookmark"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                width={400}
                height={225}
                style={{ objectFit: "cover" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60"></div>
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-zinc-900">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: bookmark.color }}
              >
                <IconBookmark className="h-8 w-8" />
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="line-clamp-1 font-medium text-white">
                  {bookmark.title ?? bookmark.name ?? "Untitled"}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                  {bookmark.url}
                </p>
              </div>
              <div
                className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
                style={{ backgroundColor: `${bookmark.color}20` }}
              >
                <IconChevronRight
                  className="h-4 w-4"
                  style={{ color: bookmark.color }}
                />
              </div>
            </div>
          </div>
        </a>

        {/* Bookmark Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              onClick={(e) => e.stopPropagation()}
              variant="ghost"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 p-0 text-zinc-400 opacity-0 backdrop-blur-sm transition-opacity hover:bg-zinc-700 hover:text-white group-hover/item:opacity-100"
            >
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 border border-zinc-700 bg-zinc-800 p-0 text-white">
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 focus:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onEditBookmark(bookmark);
              }}
            >
              <IconEdit className="h-4 w-4" />
              Edit Bookmark
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 focus:bg-zinc-700"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBookmark(bookmark.id);
              }}
            >
              <IconTrash className="h-4 w-4" />
              Delete Bookmark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!active.data.current) return;

    const { id, type, data } = active.data.current as {
      id: string;
      type: "bookmark" | "folder";
      data: BookmarkType | FolderType;
    };

    setActiveItem({ id, type, data });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      return;
    }

    // If items are the same, do nothing
    if (active.id === over.id) {
      setActiveItem(null);
      return;
    }

    const activeData = active.data.current as
      | {
          type: "bookmark" | "folder";
          id: string;
        }
      | undefined;

    if (!activeData) {
      setActiveItem(null);
      return;
    }

    const activeType = activeData.type;
    const activeId = activeData.id;
    const overId = over.id as string;
    const overData = over.data.current as
      | {
          type: "bookmark" | "folder";
          id: string;
        }
      | undefined;
    const overType = overData?.type;

    // Only allow dropping if the target is a folder or back to current folder
    if (overType === "folder" || overId === "current-folder") {
      const targetFolderId =
        overId === "current-folder" ? currentFolderId : overData?.id;

      if (!targetFolderId) {
        setActiveItem(null);
        return;
      }

      if (activeType === "bookmark") {
        // Move bookmark to folder
        moveItemMutation.mutate({
          bookmarkIds: [activeId],
          targetFolderId,
        });
      } else if (activeType === "folder") {
        // Don't allow moving parent folder into its own child folder
        const isMovingToChild = isFolderDescendant(activeId, targetFolderId);
        if (!isMovingToChild && activeId !== targetFolderId) {
          moveItemMutation.mutate({
            folderIds: [activeId],
            targetFolderId,
          });
        }
      }
    }

    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
  };

  // Check if a folder is a descendant of another folder
  const isFolderDescendant = (
    folderId: string,
    potentialParentId: string,
  ): boolean => {
    // This is a simplified version. In a real application, you'd need to recursively
    // check all parent folders
    if (!potentialParentId) return false;

    const folder = filteredFolders.find((f) => f.id === potentialParentId);
    if (!folder) return false;

    // Check if the current folder is the parent of the folder we're checking
    if (folder.parentFolderId === folderId) return true;

    // Check recursively
    return folder.parentFolderId
      ? isFolderDescendant(folderId, folder.parentFolderId)
      : false;
  };

  // CurrentFolder Droppable Component
  const CurrentFolderDroppable = ({ folder }: { folder: FolderType }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: "current-folder",
      data: {
        type: "folder",
        id: folder.id,
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={`mb-8 flex flex-col items-start space-y-2 rounded-lg border transition-all duration-200 ${
          isOver
            ? "!border-2 border-dashed border-blue-500 bg-blue-900/20 !shadow-lg !shadow-blue-500/30"
            : "border-zinc-800 bg-zinc-900/30"
        } relative p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0`}
      >
        {isOver && (
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-blue-500/30 opacity-20"></div>
        )}
        <div className="relative z-10 flex items-center">
          <div
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{
              backgroundColor: folder.color || "#3b82f6",
              boxShadow: `0 10px 15px -3px ${folder.color || "#3b82f6"}30`,
            }}
          >
            <IconFolder className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Current folder</p>
            <h2 className="text-lg font-medium text-white">{folder.name}</h2>
          </div>
        </div>
        <div className="relative z-10 flex space-x-6 text-sm text-zinc-500">
          <div className="flex items-center">
            <IconBookmark className="mr-2 h-4 w-4" />
            <span>
              {filteredBookmarks.length} bookmark
              {filteredBookmarks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center">
            <IconFolderFilled className="mr-2 h-4 w-4" />
            <span>
              {filteredFolders.length} folder
              {filteredFolders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <main className="relative flex min-h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900">
        {/* Decorative elements */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl"></div>
        <div className="absolute -left-24 top-1/2 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <Nav user={myUser.data} />

        {/* Header Section with Breadcrumbs */}
        <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="relative flex flex-col items-start">
            <div className="flex items-center space-x-1 text-sm text-zinc-400">
              <span
                onClick={() => setCurrentFolderId(null)}
                className="cursor-pointer transition-colors hover:text-blue-400"
              >
                Bookmarks
              </span>

              {currentFolder.data && currentFolder.data.id && (
                <>
                  <IconChevronRight className="h-4 w-4" />
                  <span className="text-blue-400">
                    {currentFolder.data.name ?? "Root"}
                  </span>
                </>
              )}
            </div>

            <h1 className="sora mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {currentFolder.data?.id
                ? currentFolder.data.name
                : "My Bookmarks"}
            </h1>

            <div className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent opacity-50"></div>
          </div>

          {/* Search and Actions Bar */}
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex flex-1 items-center gap-4">
              {/* Back Button - moved from grid to here */}
              {currentFolder?.data?.parentFolderId && (
                <Button
                  onClick={() => goBack()}
                  variant="outline"
                  className="group flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 active:translate-y-[1px]"
                >
                  <IconArrowBackUp className="h-4 w-4 transition-transform group-hover:animate-pulse" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <IconSearch className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 pl-10 pr-4 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setEditingBookmark(null);
                  setAddBookmarkOpen(true);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
              >
                <IconPlus className="h-4 w-4" />
                Bookmark
              </Button>

              <Button
                onClick={() => {
                  setEditingFolder(null);
                  setAddFolderOpen(true);
                }}
                variant="outline"
                className="flex items-center gap-2 border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:border-blue-500/50 hover:bg-zinc-700/50 active:translate-y-[1px]"
              >
                <IconPlus className="h-4 w-4" />
                Folder
              </Button>

              <Button
                onClick={async () => {
                  await utils.bookmarks.getFolder
                    .invalidate()
                    .catch(console.error);
                  await utils.bookmarks.getFolder.reset().catch(console.error);
                }}
                variant="ghost"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/50 p-0 text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:border-blue-500/50 hover:bg-zinc-700/50 hover:text-blue-400 active:translate-y-[1px]"
                title="Refresh"
              >
                <IconRefresh className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {currentFolder.isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-blue-600/20"></div>
                  <IconLoader2 className="absolute inset-0 h-16 w-16 animate-spin text-blue-500" />
                </div>
                <p className="text-zinc-400">Loading your bookmarks...</p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              modifiers={[restrictToWindowEdges]}
              measuring={{
                droppable: {
                  strategy: MeasuringStrategy.Always,
                },
              }}
            >
              {/* Folder Info - Droppable area */}
              {currentFolder.data?.id && (
                <CurrentFolderDroppable folder={currentFolder.data} />
              )}

              {/* Grid Layout */}
              <SortableContext
                items={[
                  ...filteredFolders.map((folder) => ({
                    id: folder.id,
                    type: "folder" as const,
                  })),
                  ...filteredBookmarks.map((bookmark) => ({
                    id: bookmark.id,
                    type: "bookmark" as const,
                  })),
                ]}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Folders */}
                  {filteredFolders.map((folder) => (
                    <DraggableFolder
                      key={folder.id}
                      folder={folder}
                      onFolderClick={handleFolderClick}
                      onEditFolder={handleEditFolder}
                      onDeleteFolder={(folderId) =>
                        deleteFolderMutation.mutate({ folderId })
                      }
                    />
                  ))}

                  {/* Bookmarks */}
                  {filteredBookmarks.map((bookmark) => (
                    <DraggableBookmark
                      key={bookmark.id}
                      bookmark={bookmark}
                      onEditBookmark={handleEditBookmark}
                      onDeleteBookmark={(bookmarkId) =>
                        deleteBookmarkMutation.mutate({ bookmarkId })
                      }
                    />
                  ))}

                  {/* Empty State */}
                  {filteredFolders.length === 0 &&
                    filteredBookmarks.length === 0 && (
                      <div className="col-span-full flex min-h-[30vh] flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
                        <div className="relative">
                          <div className="mb-4 rounded-full bg-blue-500/10 p-5">
                            <IconBookmark className="h-10 w-10 text-blue-400" />
                          </div>
                          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/10 p-5 duration-1000 ease-out"></div>
                        </div>
                        <h3 className="text-2xl font-medium text-white">
                          No bookmarks found
                        </h3>
                        <p className="mt-2 max-w-md text-zinc-400">
                          {searchQuery
                            ? "No bookmarks match your search. Try a different query."
                            : "Get started by adding your first bookmark or folder."}
                        </p>
                        <div className="mt-6 flex space-x-3">
                          <Button
                            onClick={() => {
                              setEditingBookmark(null);
                              setAddBookmarkOpen(true);
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                          >
                            <IconPlus className="h-4 w-4" />
                            Add Bookmark
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay modifiers={[restrictToWindowEdges]}>
                {activeItem && activeItem.type === "folder" && (
                  <div className="relative h-full opacity-80">
                    <div className="group relative h-full cursor-grabbing overflow-hidden rounded-xl border border-blue-500 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg shadow-blue-500/20">
                      <div
                        className="absolute inset-0 bg-gradient-to-br opacity-100"
                        style={{
                          background: `linear-gradient(135deg, ${(activeItem.data as FolderType).color}15 0%, ${(activeItem.data as FolderType).color}30 100%)`,
                        }}
                      ></div>
                      <div className="flex h-full flex-col">
                        <div className="flex items-center p-4">
                          <div
                            className="mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                            style={{
                              backgroundColor: (activeItem.data as FolderType)
                                .color,
                              boxShadow: `0 10px 15px -3px ${(activeItem.data as FolderType).color}30`,
                            }}
                          >
                            <IconFolderFilled className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">
                              {(activeItem.data as FolderType).name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeItem && activeItem.type === "bookmark" && (
                  <div className="relative h-full opacity-80">
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-blue-500 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg shadow-blue-500/20">
                      <div
                        className="absolute inset-0 bg-gradient-to-br opacity-100"
                        style={{
                          background: `linear-gradient(135deg, ${(activeItem.data as BookmarkType).color}15 0%, ${(activeItem.data as BookmarkType).color}30 100%)`,
                        }}
                      ></div>

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="line-clamp-1 font-medium text-white">
                              {(activeItem.data as BookmarkType).title ??
                                (activeItem.data as BookmarkType).name ??
                                "Untitled"}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                              {(activeItem.data as BookmarkType).url}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <Footer />
      </main>

      <AddBookmark
        isOpen={addBookmarkOpen}
        setIsOpen={setAddBookmarkOpen}
        currentFolderId={currentFolder.data?.id ?? ""}
      />

      <AddFolder
        isOpen={addFolderOpen}
        setIsOpen={setAddFolderOpen}
        currentFolderId={currentFolder.data?.id ?? ""}
      />
    </>
  );
}
