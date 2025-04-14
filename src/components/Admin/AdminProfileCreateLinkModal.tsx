import { type Profile } from "@prisma/client";
import { useState } from "react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import { defualtIcon, Icons } from "~/utils/profileLinkIcons";
import { api } from "~/trpc/react";
import { IconPlus } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import Image from "next/image";

interface AdminProfileCreateLinkModalProps {
  profile: Profile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AdminProfileCreateLinkModal({
  profile,
  isOpen,
  setIsOpen,
}: AdminProfileCreateLinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fgColor, setFgColor] = useState("#000000");
  const [iconUrl, setIconUrl] = useState(defualtIcon.icon);

  const utils = api.useUtils();

  const createProfileLinkMutation = api.admin.createProfileLink.useMutation({
    onSuccess: async () => {
      toast.success("Link created successfully", toastOptions);
      resetForm();
      setIsOpen(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setBgColor("#ffffff");
    setFgColor("#000000");
    setIconUrl(defualtIcon.icon);
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();

    createProfileLinkMutation.mutate({
      profileId: profile.id,
      title,
      url,
      description,
      bgColor,
      fgColor,
      iconUrl,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Profile Link</DialogTitle>
          <DialogDescription>Add a new link to this profile</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateLink} className="space-y-4">
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
                  placeholder="#ffffff"
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
                  placeholder="#000000"
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
                    iconUrl === icon.icon ? "border-primary bg-primary/10" : ""
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

          <DialogFooter>
            <Button
              type="submit"
              disabled={createProfileLinkMutation.isPending}
            >
              <IconPlus className="mr-2 h-4 w-4" />
              {createProfileLinkMutation.isPending
                ? "Creating..."
                : "Create Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
