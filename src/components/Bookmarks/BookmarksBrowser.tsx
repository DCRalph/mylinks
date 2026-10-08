"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  IconArrowBackUp,
  IconFolder,
  IconFolderPlus,
  IconPencil,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import Empty from "~/components/Empty";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Bookmark, BookmarkFolder } from "~/generated/prisma/client";
import { displayUrl, plural } from "~/lib/format";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import BookmarkDialog from "./BookmarkDialog";
import FolderDialog from "./FolderDialog";

type Folder = RouterOutputs["bookmarks"]["getFolder"];
type Subfolder = Folder["subfolders"][number];
type Dragged =
  { type: "bookmark"; item: Bookmark } | { type: "folder"; item: Subfolder };
type DialogState =
  | { kind: "bookmark"; bookmark?: Bookmark }
  | { kind: "folder"; folder?: BookmarkFolder }
  | null;

const folderHref = (id: string | null) =>
  id ? `/bookmarks/${id}` : "/bookmarks";

/** /bookmarks/[...folderId]: one folder's subfolders and bookmarks. */
export default function BookmarksBrowser({
  folderId,
  isAdmin,
}: {
  folderId: string | null;
  isAdmin: boolean;
}) {
  const folder = api.bookmarks.getFolder.useQuery({ folderId });
  const path = api.bookmarks.getFolderPath.useQuery({ folderId });
  const utils = api.useUtils();

  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dragged, setDragged] = useState<Dragged | null>(null);

  const move = api.bookmarks.moveItem.useMutation({
    onSuccess: () => utils.bookmarks.invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const samples = api.bookmarks.createSampleBookmarks.useMutation({
    onSuccess: () => utils.bookmarks.invalidate(),
  });

  // Drags start after a small move, so plain clicks still open links.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (folder.error) {
    return (
      <Empty title="Folder not found" className="mt-10">
        <Link href="/bookmarks" className="text-lime hover:underline">
          Back to bookmarks
        </Link>
      </Empty>
    );
  }

  const current = folder.data;
  const crumbs = path.data ?? [];
  const parent = crumbs.at(-2);
  const q = query.trim().toLowerCase();
  const folders = (current?.subfolders ?? []).filter(
    (f) => !q || f.name.toLowerCase().includes(q),
  );
  const bookmarks = (current?.bookmarks ?? []).filter(
    (b) =>
      !q || b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
  );
  const isEmpty =
    current?.subfolders.length === 0 && current.bookmarks.length === 0;

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    const bookmark = current?.bookmarks.find((b) => `b:${b.id}` === id);
    const sub = current?.subfolders.find((f) => `f:${f.id}` === id);
    setDragged(
      bookmark
        ? { type: "bookmark", item: bookmark }
        : sub
          ? { type: "folder", item: sub }
          : null,
    );
  };

  const onDragEnd = ({ over }: DragEndEvent) => {
    const item = dragged;
    setDragged(null);
    const target = over ? String(over.id) : null;
    if (!item || !target || target === item.item.id) return;
    move.mutate(
      item.type === "bookmark"
        ? { bookmarkIds: [item.item.id], targetFolderId: target }
        : { folderIds: [item.item.id], targetFolderId: target },
    );
  };

  return (
    <>
      <header className="mb-8">
        {crumbs.length > 1 && (
          <nav className="display text-muted mb-2 flex flex-wrap items-center gap-2 text-lg">
            {crumbs.slice(0, -1).map((crumb) => (
              <Fragment key={crumb.id || "root"}>
                <Link href={folderHref(crumb.id)} className="hover:text-ink">
                  {crumb.name}
                </Link>
                <span className="text-faint">/</span>
              </Fragment>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display min-w-0 text-[60px] leading-[1.15] break-words sm:text-[96px]">
            {folderId ? (current?.name ?? " ") : "Bookmarks"}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!current}
              onClick={() => setDialog({ kind: "folder" })}
            >
              <IconFolderPlus /> Folder
            </Button>
            <Button
              disabled={!current}
              onClick={() => setDialog({ kind: "bookmark" })}
            >
              <IconPlus /> Bookmark
            </Button>
          </div>
        </div>
      </header>

      {!isEmpty && (
        <label className="relative mb-6 block max-w-sm">
          <IconSearch className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            className="h-10 pl-10"
            placeholder="Search this folder"
            aria-label="Search this folder"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}

      {isEmpty ? (
        <Empty title={folderId ? "Empty folder" : "No bookmarks yet"}>
          <p>Add a bookmark or a folder to get started.</p>
          {isAdmin && !folderId && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={samples.isPending}
              onClick={() => samples.mutate()}
            >
              Add sample bookmarks
            </Button>
          )}
        </Empty>
      ) : (
        <DndContext
          id="bookmarks"
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragged(null)}
        >
          {dragged && current?.parentFolderId && (
            <ParentDrop
              id={current.parentFolderId}
              name={parent?.name ?? "parent folder"}
            />
          )}

          {folders.length > 0 && (
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {folders.map((sub) => (
                <FolderTile
                  key={sub.id}
                  folder={sub}
                  dragging={dragged?.item.id === sub.id}
                  canDrop={!!dragged && dragged.item.id !== sub.id}
                  onEdit={() => setDialog({ kind: "folder", folder: sub })}
                />
              ))}
            </div>
          )}

          {bookmarks.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <BookmarkTile
                  key={bookmark.id}
                  bookmark={bookmark}
                  dragging={dragged?.item.id === bookmark.id}
                  onEdit={() => setDialog({ kind: "bookmark", bookmark })}
                />
              ))}
            </div>
          )}

          {q && folders.length === 0 && bookmarks.length === 0 && (
            <Empty title="No matches">Nothing here matches “{query}”.</Empty>
          )}

          <DragOverlay dropAnimation={null}>
            {dragged && (
              <div className="display bg-lime text-lime-ink flex h-14 w-64 items-center gap-3 rounded-xl px-4 text-xl shadow-2xl">
                {dragged.type === "folder" ? <IconFolder /> : null}
                <span className="truncate">{dragged.item.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {dialog?.kind === "bookmark" && current && (
        <BookmarkDialog
          key={dialog.bookmark?.id ?? "new"}
          folderId={current.id}
          bookmark={dialog.bookmark}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "folder" && current && (
        <FolderDialog
          key={dialog.folder?.id ?? "new"}
          parentId={current.id}
          folder={dialog.folder}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

/** Drop zone shown while dragging inside a subfolder. */
function ParentDrop({ id, name }: { id: string; name: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "display mb-4 flex h-14 items-center gap-3 rounded-xl border-[1.5px] border-dashed px-4 text-xl",
        isOver ? "border-lime bg-lime/10 text-lime" : "border-faint text-muted",
      )}
    >
      <IconArrowBackUp /> Move up to {name}
    </div>
  );
}

function FolderTile({
  folder,
  dragging,
  canDrop,
  onEdit,
}: {
  folder: Subfolder;
  dragging: boolean;
  canDrop: boolean;
  onEdit: () => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: folder.id,
    disabled: !canDrop,
  });
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: `f:${folder.id}`,
  });

  return (
    <div
      ref={setDropRef}
      className={cn(
        "bg-panel rounded-2xl border-[1.5px] transition-colors",
        isOver ? "border-lime bg-lime/10" : "border-transparent",
        dragging && "opacity-40",
      )}
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="group relative"
      >
        <Link
          href={folderHref(folder.id)}
          className="flex items-center gap-3.5 p-4 pr-12"
          draggable={false}
        >
          <span
            className="text-lime-ink grid size-11 shrink-0 place-items-center rounded-xl"
            style={{ background: folder.color }}
          >
            <IconFolder className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="display truncate-display block text-[26px] leading-none">
              {folder.name}
            </span>
            <span className="text-muted mt-1 block text-[13px]">
              {plural(folder._count.bookmarks, "bookmark")}
              {folder._count.subfolders > 0 &&
                ` · ${plural(folder._count.subfolders, "folder")}`}
            </span>
          </span>
        </Link>
        <EditButton label={`Edit ${folder.name}`} onClick={onEdit} />
      </div>
    </div>
  );
}

function BookmarkTile({
  bookmark,
  dragging,
  onEdit,
}: {
  bookmark: Bookmark;
  dragging: boolean;
  onEdit: () => void;
}) {
  const { setNodeRef, attributes, listeners } = useDraggable({
    id: `b:${bookmark.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-panel hover:bg-raised relative rounded-2xl transition-colors",
        dragging && "opacity-40",
      )}
    >
      <a
        href={bookmark.url}
        target="_blank"
        rel="noreferrer"
        draggable={false}
        className="flex items-center gap-3.5 p-4 pr-12"
      >
        <span
          className="display text-lime-ink grid size-11 shrink-0 place-items-center rounded-xl text-2xl ring-1 ring-white/10 ring-inset"
          style={{ background: bookmark.color }}
        >
          {bookmark.name.trim().charAt(0) || "?"}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{bookmark.name}</span>
          <span className="text-muted block truncate text-[13px]">
            {displayUrl(bookmark.url)}
          </span>
        </span>
      </a>
      <EditButton label={`Edit ${bookmark.name}`} onClick={onEdit} />
    </div>
  );
}

function EditButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className="absolute top-1/2 right-3 -translate-y-1/2 border-transparent opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
      // Keep the press from starting a drag.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      <IconPencil />
    </Button>
  );
}
