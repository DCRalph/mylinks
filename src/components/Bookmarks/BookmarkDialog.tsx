"use client";

import { useState } from "react";
import { toast } from "sonner";

import ColorPicker from "~/components/ColorPicker";
import ConfirmDelete from "~/components/ConfirmDelete";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Field, Label } from "~/components/ui/label";
import type { Bookmark } from "~/generated/prisma/client";
import { hostOf } from "~/lib/format";
import { api } from "~/trpc/react";
import FolderSelect from "./FolderSelect";

/** Add a bookmark to `folderId`, or edit/move/delete `bookmark`. */
export default function BookmarkDialog({
  folderId,
  bookmark,
  onClose,
}: {
  folderId: string;
  bookmark?: Bookmark;
  onClose: () => void;
}) {
  const [name, setName] = useState(bookmark?.name ?? "");
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [color, setColor] = useState(bookmark?.color ?? "#c8f560");
  const [folder, setFolder] = useState(bookmark?.folderId ?? folderId);

  const utils = api.useUtils();
  const done = async (message: string) => {
    toast.success(message);
    onClose();
    await utils.bookmarks.invalidate();
  };

  const create = api.bookmarks.createBookmark.useMutation({
    onSuccess: () => done("Bookmark added"),
  });
  const edit = api.bookmarks.editBookmark.useMutation({
    onSuccess: () => done("Bookmark saved"),
  });
  const remove = api.bookmarks.deleteBookmark.useMutation({
    onSuccess: () => done("Bookmark deleted"),
    onError: (error) => toast.error(error.message),
  });
  const error = (bookmark ? edit : create).error;
  const pending = create.isPending || edit.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bookmark ? "Edit bookmark" : "New bookmark"}</DialogTitle>
        </DialogHeader>
        <form
          id="bookmark-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = url.trim();
            const finalName = name.trim() || hostOf(trimmed);
            if (bookmark) {
              edit.mutate({
                bookmarkId: bookmark.id,
                newName: finalName,
                newUrl: trimmed,
                newColor: color,
                newFolderId: folder,
              });
            } else {
              create.mutate({
                name: finalName,
                url: trimmed,
                color,
                folderId: folder,
              });
            }
          }}
        >
          <Field label="URL" htmlFor="bm-url">
            <Input
              id="bm-url"
              type="url"
              required
              autoFocus={!bookmark}
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label="Name" htmlFor="bm-name">
            <Input
              id="bm-name"
              placeholder={url ? hostOf(url) : "Optional"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Folder" htmlFor="bm-folder">
            <FolderSelect id="bm-folder" value={folder} onChange={setFolder} />
          </Field>
          <div className="grid gap-1.5">
            <Label>Colour</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          {error && <p className="text-sm text-danger">{error.message}</p>}
        </form>
        <DialogFooter className={bookmark ? "sm:justify-between" : undefined}>
          {bookmark && (
            <ConfirmDelete
              title="Delete this bookmark?"
              description={`“${bookmark.name}” will be removed.`}
              onConfirm={() => remove.mutate({ bookmarkId: bookmark.id })}
              pending={remove.isPending}
            />
          )}
          <Button type="submit" form="bookmark-form" disabled={pending}>
            {pending ? "Saving…" : bookmark ? "Save" : "Add bookmark"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
