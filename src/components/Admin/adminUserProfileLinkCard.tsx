import { type ProfileLink } from "@prisma/client";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import Image from "next/image";
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
import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import { defualtIcon } from "~/utils/profileLinkIcons";

interface AdminUserProfileLinkCardProps {
  link: ProfileLink;
  onEdit: () => void;
}

export function AdminUserProfileLinkCard({
  link,
  onEdit,
}: AdminUserProfileLinkCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const utils = api.useUtils();

  const deleteLinkMutation = api.admin.deleteProfileLink.useMutation({
    onSuccess: async () => {
      toast.success("Link deleted successfully", toastOptions);
      setIsDeleteDialogOpen(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const handleDeleteLink = () => {
    deleteLinkMutation.mutate({
      id: link.id,
    });
  };

  const icon = link.iconUrl
    ? "/profileLinkIcons/" + link.iconUrl
    : "/profileLinkIcons/" + defualtIcon.icon;

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex aspect-square h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Image
                src={icon}
                alt={link.title}
                width={40}
                height={40}
                className="p-2"
              />
            </div>
            <div>
              <h4 className="font-medium">{link.title}</h4>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:underline"
              >
                {link.url}
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onEdit}>
              <IconEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
              onClick={handleDeleteLink}
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
