// app/bookmarks/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import Link from "next/link";
import type { Bookmark, BookmarkFolder } from "@prisma/client";
import { toast } from "react-toastify";
import ToastOptions from "~/utils/toastOptions";

type DragItemType = {
  id: string;
  type: "bookmark" | "folder";
  data: Bookmark | BookmarkFolder;
};

export default function BookmarksPage() {
  const router = useRouter();
  const pathname = usePathname();

  const utils = api.useUtils();
  const myUser = api.user.getUser.useQuery();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  // const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
  //   { id: null, name: "Bookmarks" },
  // ]);

  const currentFolder = api.bookmarks.getFolder.useQuery({
    folderId: currentFolderId,
  });
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingFolder, setEditingFolder] = useState<BookmarkFolder | null>(
    null,
  );
  const [activeItem, setActiveItem] = useState<DragItemType | null>(null);
  const [parentFolder, setParentFolder] = useState<BookmarkFolder | null>(null);
  // Track if dragging is active to highlight all potential drop targets
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [isCreatingSamples, setIsCreatingSamples] = useState(false);

  const breadcrumbs = api.bookmarks.getFolderPath.useQuery({
    folderId: currentFolderId,
  });

  const createSampleBookmarksMutation =
    api.bookmarks.createSampleBookmarks.useMutation();

  useEffect(() => {
    const prefetchFolder = async () => {
      if (currentFolder.data) {
        const prefetchFolders: string[] = [];

        for (const folder of currentFolder.data.subfolders) {
          prefetchFolders.push(folder.id);
        }

        if (currentFolder.data.parentFolderId) {
          prefetchFolders.push(currentFolder.data.parentFolderId);
        }

        await Promise.allSettled([
          prefetchFolders?.map((folder) => [
            utils.bookmarks.getFolder.prefetch({
              folderId: folder,
            }),
            utils.bookmarks.getFolderPath.prefetch({
              folderId: folder,
            }),
          ]),
        ]);
      }
    };

    prefetchFolder().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder.data]);

  // Update URL path parsing to better detect folder IDs
  useEffect(() => {
    const pathParts = pathname.split("/").filter(Boolean);

    console.log(pathParts);

    // Detect if we are in bookmarks route
    if (pathParts[0] === "bookmarks") {
      // If there's a second part, it's a folder ID
      if (pathParts.length > 1) {
        const lastFolderId = pathParts[pathParts.length - 1];
        if (lastFolderId) {
          setCurrentFolderId(lastFolderId);
        }
      } else {
        // We're at the root bookmarks route
        setCurrentFolderId(null);
      }

      // Invalidate the folder query to ensure we get fresh data on navigation
      void utils.bookmarks.getFolder.invalidate();
    }
  }, [pathname, utils.bookmarks.getFolder]);

  // Fetch parent folder data when needed
  useEffect(() => {
    const fetchParentFolder = async () => {
      if (currentFolder.data?.parentFolderId) {
        try {
          const data = await utils.bookmarks.getFolder.fetch({
            folderId: currentFolder.data.parentFolderId,
          });
          setParentFolder(
            data as BookmarkFolder & {
              _count: { bookmarks: number; subfolders: number };
            },
          );
        } catch (error) {
          console.error(error);
        }
      } else {
        setParentFolder(null);
      }
    };

    void fetchParentFolder();
  }, [currentFolder.data?.parentFolderId, utils.bookmarks.getFolder]);

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
    // Update URL
    if (currentFolderId) {
      router.push(`/bookmarks/${folderId}`);
    } else {
      router.push(`/bookmarks/${folderId}`);
    }
  };

  // Fix and simplify the back button function
  const goBack = () => {
    if (currentFolder.data?.parentFolderId) {
      // Go to parent folder
      router.push(`/bookmarks/${currentFolder.data.parentFolderId}`);
    } else {
      // Go to root
      router.push("/bookmarks");
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
  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setAddBookmarkOpen(true);
  };

  // Edit a folder
  const handleEditFolder = (folder: BookmarkFolder) => {
    setEditingFolder(folder);
    setAddFolderOpen(true);
  };

  // Filter bookmarks based on search query
  const filteredBookmarks =
    currentFolder.data?.bookmarks?.filter(
      (bookmark) =>
        (bookmark.name ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  // Filter folders based on search query
  const filteredFolders =
    currentFolder.data?.subfolders?.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  // Draggable Folder Component
  const DraggableFolder = ({
    folder,
    onFolderClick,
    onEditFolder,
    onDeleteFolder,
  }: {
    folder: BookmarkFolder & {
      _count: { bookmarks: number; subfolders: number };
    };
    onFolderClick: (id: string) => void;
    onEditFolder: (folder: BookmarkFolder) => void;
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
      data: {
        type: "folder",
        accept: ["bookmark", "folder"],
        id: folder.id,
      },
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
          className={`group relative h-full cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-zinc-900/50 ${
            isOver
              ? "border-2 border-dashed border-green-500 bg-green-900/20 shadow-lg shadow-green-500/30"
              : isDraggingActive && !isDragging
                ? "border-2 border-dashed border-orange-500/70 bg-orange-900/10 shadow-md shadow-orange-500/20"
                : "border border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${folder.color}15 0%, ${folder.color}30 100%)`,
            }}
          ></div>
          {/* Add tint effect when hovering for drop */}
          {isOver && (
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded-xl bg-green-500/20 opacity-30"></div>
          )}
          {isDraggingActive && !isOver && !isDragging && (
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-orange-500/10 opacity-20"></div>
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
    bookmark: Bookmark;
    onEditBookmark: (bookmark: Bookmark) => void;
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
          className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900 transition-all duration-300 hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${bookmark.color}15 0%, ${bookmark.color}30 100%)`,
            }}
          ></div>

          <div className="flex items-center p-4">
            <div
              className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: bookmark.color,
                boxShadow: `0 10px 15px -3px ${bookmark.color}30`,
              }}
            >
              <IconBookmark className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="line-clamp-1 font-medium text-white">
                {bookmark.name ?? "Untitled"}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                {bookmark.url}
              </p>
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
      data: Bookmark | BookmarkFolder;
    };

    setActiveItem({ id, type, data });
    setIsDraggingActive(true);
  };

  // ParentFolder Droppable Component
  const ParentFolderDroppable = ({
    folder,
  }: {
    folder: BookmarkFolder & {
      _count?: { bookmarks: number; subfolders: number };
    };
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: "parent-folder",
      data: {
        type: "folder",
        id: folder.id,
        accept: ["bookmark", "folder"],
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={`flex h-min w-full flex-col items-start space-y-2 rounded-lg border-2 transition-all duration-200 ${
          isOver
            ? "border-dashed border-green-500 bg-green-900/20 shadow-lg shadow-green-500/30"
            : isDraggingActive
              ? "border-dashed border-orange-500/70 bg-orange-900/10 shadow-md shadow-orange-500/20"
              : "border-dashed border-amber-500/50 bg-amber-900/10 hover:border-amber-500 hover:bg-amber-900/20"
        } relative p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0`}
      >
        {isOver && (
          <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-green-500/20 opacity-30"></div>
        )}
        {isDraggingActive && !isOver && (
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-orange-500/10 opacity-20"></div>
        )}
        <div className="relative z-10 flex items-center">
          <div
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg"
            style={{
              backgroundColor: folder.color ?? "#f59e0b",
              boxShadow: `0 10px 15px -3px ${folder.color ?? "#f59e0b"}30`,
            }}
          >
            <IconArrowBackUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="flex items-center text-lg font-medium text-white">
              <IconArrowBackUp className="mr-2 h-4 w-4" />
              Move to {folder.name}
            </h2>
          </div>
        </div>
        <div className="relative z-10 flex space-x-6 text-sm text-zinc-400">
          <div className="flex items-center">
            <IconFolder className="mr-2 h-5 w-5 text-amber-400" />
            <span>Parent folder</span>
          </div>
        </div>
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveItem(null);
      setIsDraggingActive(false);
      return;
    }

    // If items are the same, do nothing
    if (active.id === over.id) {
      setActiveItem(null);
      setIsDraggingActive(false);
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
      setIsDraggingActive(false);
      return;
    }

    const activeType = activeData.type;
    const activeId = activeData.id;
    const overId = over.id as string;
    const overData = over.data.current as
      | {
          type: string;
          id: string;
          accept?: string[];
        }
      | undefined;

    // Determine if the target is a folder or the parent folder
    const isTargetFolder =
      overData?.type === "folder" || overId === "parent-folder";

    // Check if the target accepts the active item type
    const acceptsItem =
      overData?.accept?.includes(activeType) ?? overId === "parent-folder";

    // Only proceed if target accepts the active item type
    if (isTargetFolder && acceptsItem) {
      let targetFolderId: string | null = null;

      if (overId === "parent-folder" && parentFolder) {
        targetFolderId = parentFolder.id;
      } else if (overData?.id) {
        targetFolderId = overData.id;
      }

      if (!targetFolderId) {
        setActiveItem(null);
        setIsDraggingActive(false);
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
        // Don't allow moving folder to itself
        const isMovingToSelf = activeId === targetFolderId;

        if (!isMovingToChild && !isMovingToSelf) {
          moveItemMutation.mutate({
            folderIds: [activeId],
            targetFolderId,
          });
        }
      }
    }

    setActiveItem(null);
    setIsDraggingActive(false);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setIsDraggingActive(false);
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
  const CurrentFolder = ({
    folder,
  }: {
    folder: BookmarkFolder & {
      _count: { bookmarks: number; subfolders: number };
    };
  }) => {
    // Remove droppable functionality - this is just an informational display now
    return (
      <div className="relative mb-8 flex w-full flex-col items-start space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 backdrop-blur-sm transition-all duration-200 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative z-10 flex items-center">
          <div
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{
              backgroundColor: folder.color ?? "#3b82f6",
              boxShadow: `0 10px 15px -3px ${folder.color ?? "#3b82f6"}30`,
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
              {folder._count.bookmarks} bookmark
              {folder._count.bookmarks !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center">
            <IconFolderFilled className="mr-2 h-4 w-4" />
            <span>
              {folder._count.subfolders} folder
              {folder._count.subfolders !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Function to add sample bookmarks
  const handleAddSampleBookmarks = async () => {
    setIsCreatingSamples(true);
    try {
      createSampleBookmarksMutation.mutate();
      await utils.bookmarks.getFolder.invalidate();
      toast.success("Sample bookmarks created!", ToastOptions);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, ToastOptions);
      } else {
        toast.error("Failed to create sample bookmarks", ToastOptions);
      }
    } finally {
      setIsCreatingSamples(false);
    }
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
              {breadcrumbs.data?.map((crumb, index) => (
                <div key={crumb.id ?? "root"} className="flex items-center">
                  {index > 0 && <IconChevronRight className="mx-1 h-4 w-4" />}
                  {index === breadcrumbs.data?.length - 1 ? (
                    <span className="text-blue-400">{crumb.name}</span>
                  ) : (
                    <Link
                      href={crumb.id ? `/bookmarks/${crumb.id}` : "/bookmarks"}
                      className="cursor-pointer transition-colors hover:text-blue-400"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
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
                <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3">
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
              <div className="flex w-full gap-4">
                {/* Folder Info - Droppable areas */}
                {activeItem && parentFolder && (
                  <ParentFolderDroppable folder={parentFolder} />
                )}

                {currentFolder.data?.id && (
                  <CurrentFolder folder={currentFolder.data} />
                )}
              </div>

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
                          background: `linear-gradient(135deg, ${(activeItem.data as BookmarkFolder).color}15 0%, ${(activeItem.data as BookmarkFolder).color}30 100%)`,
                        }}
                      ></div>
                      <div className="flex h-full flex-col">
                        <div className="flex items-center p-4">
                          <div
                            className="mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                            style={{
                              backgroundColor: (
                                activeItem.data as BookmarkFolder
                              ).color,
                              boxShadow: `0 10px 15px -3px ${(activeItem.data as BookmarkFolder).color}30`,
                            }}
                          >
                            <IconFolderFilled className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">
                              {(activeItem.data as BookmarkFolder).name}
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
                          background: `linear-gradient(135deg, ${(activeItem.data as Bookmark).color}15 0%, ${(activeItem.data as Bookmark).color}30 100%)`,
                        }}
                      ></div>

                      <div className="flex items-center p-4">
                        <div
                          className="mr-4 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg"
                          style={{
                            backgroundColor: (activeItem.data as Bookmark)
                              .color,
                            boxShadow: `0 10px 15px -3px ${(activeItem.data as Bookmark).color}30`,
                          }}
                        >
                          <IconBookmark className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="line-clamp-1 font-medium text-white">
                            {(activeItem.data as Bookmark).name ?? "Untitled"}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                            {(activeItem.data as Bookmark).url}
                          </p>
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

        {/* Admin button for sample bookmarks - only visible to admins */}
        {myUser.data?.user?.admin && (
          <div className="fixed bottom-8 right-8 z-50">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 blur transition duration-200 group-hover:opacity-100"></div>
              <Button
                onClick={handleAddSampleBookmarks}
                className="relative flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white transition-all duration-200 hover:bg-zinc-800"
                disabled={isCreatingSamples}
              >
                {isCreatingSamples ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconPlus className="h-4 w-4" />
                )}
                {isCreatingSamples ? "Creating..." : "Add Sample Bookmarks"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <AddBookmark
        isOpen={addBookmarkOpen}
        setIsOpen={setAddBookmarkOpen}
        currentFolderId={currentFolder.data?.id ?? ""}
        editingBookmark={editingBookmark}
      />

      <AddFolder
        isOpen={addFolderOpen}
        setIsOpen={setAddFolderOpen}
        currentFolderId={currentFolder.data?.id ?? ""}
        editingFolder={editingFolder}
      />
    </>
  );
}
