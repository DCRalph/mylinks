import { type ProfileLink } from "@prisma/client";
import { useState } from "react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import { defualtIcon, Icons } from "~/utils/profileLinkIcons";
import { api } from "~/trpc/react";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Image from "next/image";

interface AdminProfileEditLinkModalProps {
  profileLink: ProfileLink;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AdminProfileEditLinkModal({
  profileLink,
  isOpen,
  setIsOpen,
}: AdminProfileEditLinkModalProps) {
  const [title, setTitle] = useState(profileLink.title);
  const [url, setUrl] = useState(profileLink.url);
  const [description, setDescription] = useState(profileLink.description ?? "");
  const [bgColor, setBgColor] = useState(profileLink.bgColor ?? "");
  const [fgColor, setFgColor] = useState(profileLink.fgColor ?? "");
  const [iconUrl, setIconUrl] = useState(
    profileLink.iconUrl ?? defualtIcon.icon,
  );

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const utils = api.useUtils();

  const updateProfileLinkMutation = api.admin.updateProfileLink.useMutation({
    onSuccess: async () => {
      toast.success("Link updated successfully", toastOptions);
      setIsOpen(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const deleteProfileLinkMutation = api.admin.deleteProfileLink.useMutation({
    onSuccess: async () => {
      toast.success("Link deleted successfully", toastOptions);
      setIsDeleteDialogOpen(false);
      setIsOpen(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const handleUpdateLink = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfileLinkMutation.mutate({
      id: profileLink.id,
      title,
      url,
      description,
      bgColor,
      fgColor,
      iconUrl,
    });
  };

  const handleDeleteLink = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteProfileLinkMutation.mutate({
      id: profileLink.id,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Link</DialogTitle>
            <DialogDescription>
              Update the details of this profile link
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Link title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fgColor">Text Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fgColor"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {Icons.map((icon) => (
                  <div
                    key={icon.icon}
                    className={`flex aspect-square items-center justify-center rounded-lg border p-1 hover:bg-accent hover:text-accent-foreground ${
                      iconUrl === icon.icon
                        ? "border-primary bg-primary/10"
                        : ""
                    }`}
                    onClick={() => setIconUrl(icon.icon)}
                  >
                    <Image
                      src={`/profileLinkIcons/${icon.icon}`}
                      alt={icon.name}
                      width={32}
                      height={32}
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteLink}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </Button>

              <Button
                type="submit"
                disabled={updateProfileLinkMutation.isPending}
              >
                <IconDeviceFloppy className="mr-2 h-4 w-4" />
                {updateProfileLinkMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this link? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
