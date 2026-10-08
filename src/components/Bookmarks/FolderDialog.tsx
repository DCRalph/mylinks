"use client";

import { useRouter } from "next/navigation";
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
import type { BookmarkFolder } from "~/generated/prisma/client";
import { api } from "~/trpc/react";
import FolderSelect from "./FolderSelect";

/** Make a folder inside `parentId`, or rename/recolour/move/delete `folder`. */
export default function FolderDialog({
  parentId,
  folder,
  onClose,
}: {
  parentId: string;
  folder?: BookmarkFolder;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState(folder?.color ?? "#7dd3fc");
  const [parent, setParent] = useState(folder?.parentFolderId ?? parentId);

  const utils = api.useUtils();
  const done = async (message: string) => {
    toast.success(message);
    onClose();
    await utils.bookmarks.invalidate();
  };

  const create = api.bookmarks.createFolder.useMutation({
    onSuccess: () => done("Folder created"),
  });
  const edit = api.bookmarks.editFolder.useMutation({
    onSuccess: () => done("Folder saved"),
  });
  const remove = api.bookmarks.deleteFolder.useMutation({
    onSuccess: async () => {
      await done("Folder deleted");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const error = (folder ? edit : create).error;
  const pending = create.isPending || edit.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{folder ? "Edit folder" : "New folder"}</DialogTitle>
        </DialogHeader>
        <form
          id="folder-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (folder) {
              edit.mutate({
                folderId: folder.id,
                newName: name.trim(),
                newColor: color,
                newFolderId: parent,
              });
            } else {
              create.mutate({ name: name.trim(), color, folderId: parent });
            }
          }}
        >
          <Field label="Name" htmlFor="folder-name">
            <Input
              id="folder-name"
              required
              autoFocus={!folder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Inside" htmlFor="folder-parent">
            <FolderSelect
              id="folder-parent"
              value={parent}
              onChange={setParent}
              exclude={folder?.id}
            />
          </Field>
          <div className="grid gap-1.5">
            <Label>Colour</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          {error && <p className="text-sm text-danger">{error.message}</p>}
        </form>
        <DialogFooter className={folder ? "sm:justify-between" : undefined}>
          {folder && (
            <ConfirmDelete
              title="Delete this folder?"
              description={`“${folder.name}” and everything inside it will be deleted.`}
              onConfirm={() => remove.mutate({ folderId: folder.id })}
              pending={remove.isPending}
            />
          )}
          <Button type="submit" form="folder-form" disabled={pending}>
            {pending ? "Saving…" : folder ? "Save" : "Create folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
