import { type ProfileLink } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ModelCloseBtn from "~/components/ModelCloseBtn";
import { api } from "~/trpc/react";
import ProfileLinkElement from "~/components/ProfilePage/ProfileLink";
import { defualtIcon, Icons } from "~/utils/profileLinkIcons";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import toastOptions from "~/utils/toastOptions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import Image from "next/image";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface DashLinkEditModelProps {
  profileLink: ProfileLink;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isAdmin?: boolean;
}

export default function DashProfileEditModel({
  profileLink,
  isOpen,
  setIsOpen,
  isAdmin = false,
}: DashLinkEditModelProps) {
  const [isClosing, setIsClosing] = useState(false);

  const [newLinkTitle, setNewLinkTitle] = useState(profileLink.title);
  const [newLinkUrl, setNewLinkUrl] = useState(profileLink.url);
  const [newLinkDescription, setNewLinkDescription] = useState(
    profileLink.description ?? "",
  );
  const [newLinkBgColor, setNewLinkBgColor] = useState(
    profileLink.bgColor ?? "",
  );
  const [newLinkFgColor, setNewLinkFgColor] = useState(
    profileLink.fgColor ?? "",
  );
  const [newLinkIconUrl, setNewLinkIconUrl] = useState(
    profileLink.iconUrl ?? defualtIcon.icon,
  );

  const profiles = api.profile.getProfiles.useQuery();
  const utils = api.useUtils();

  // Use admin mutations if in admin context, otherwise use profile mutations
  const editProfileLinkMutation = isAdmin
    ? api.admin.updateProfileLink.useMutation({
        onSuccess: async () => {
          toast.success("Link edited successfully", toastOptions);
          setIsClosing(true);
          await utils.admin.getUser.invalidate();
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      })
    : api.profile.editProfileLink.useMutation({
        onSuccess: () => {
          toast.success("Link edited successfully", toastOptions);
          setIsClosing(true);
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      });

  const deleteProfileLinkMutation = isAdmin
    ? api.admin.deleteProfileLink.useMutation({
        onSuccess: async () => {
          toast.success("Link deleted successfully", toastOptions);
          setIsDeleteDialogOpen(false);
          setIsClosing(true);
          await utils.admin.getUser.invalidate();
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      })
    : api.profile.deleteProfileLink.useMutation({
        onSuccess: () => {
          toast.success("Link deleted successfully", toastOptions);
          setIsDeleteDialogOpen(false);
          setIsClosing(true);
          profiles
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, toastOptions);
            });
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const editProfileLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    editProfileLinkMutation.mutate({
      id: profileLink.id,
      title: newLinkTitle,
      url: newLinkUrl,
      description: newLinkDescription,
      bgColor: newLinkBgColor,
      fgColor: newLinkFgColor,
      iconUrl: newLinkIconUrl,
    });
  };

  const deleteProfileLinkHandler = async () => {
    // Instead of deleting right away, open confirmation dialog
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    deleteProfileLinkMutation.mutate({ id: profileLink.id });
  };

  useEffect(() => {
    const body = document.querySelector("body");

    if (isOpen) {
      body!.style.overflowY = "hidden";
    } else {
      body!.style.overflowY = "scroll";
    }
  }, [isOpen]);

  useEffect(() => {
    if (isClosing) {
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 300);
    }
  }, [isClosing, setIsOpen]);

  const content: ReactNode = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
      className={
        "fixed inset-0 z-50 flex h-screen cursor-pointer justify-center overflow-y-scroll bg-black bg-opacity-25 p-4 backdrop-blur-lg md:p-16"
      }
      onClick={() => setIsClosing(true)}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={isClosing ? { y: "50vh", opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 12, mass: 0.75 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className={
          "relative m-2 grid h-fit w-full cursor-auto grid-cols-12 overflow-hidden rounded-2xl bg-zinc-800 p-8 shadow-lg"
        }
      >
        <ModelCloseBtn setIsClosing={setIsClosing} />

        <div className="col-span-full flex justify-center text-white">
          <h1 className="text-4xl font-semibold">Edit Profile Link</h1>
        </div>

        <div className="col-span-full col-start-1 mx-auto mt-8 flex w-full justify-center md:col-span-6 md:col-start-4">
          <form
            onSubmit={editProfileLinkHandler}
            className="grid w-full grid-cols-2 gap-4"
          >
            <div className="col-span-full">
              <label
                htmlFor="newLinkName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Name
              </label>
              <Input
                type="text"
                id="newLinkName"
                placeholder="Name"
                value={newLinkTitle}
                onChange={(e) => {
                  setNewLinkTitle(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newLinkUrl"
                className="mb-2 block text-sm font-medium text-white"
              >
                URL
              </label>
              <Input
                type="text"
                id="newLinkUrl"
                placeholder="URL"
                value={newLinkUrl}
                onChange={(e) => {
                  setNewLinkUrl(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newLinkDescription"
                className="mb-2 block text-sm font-medium text-white"
              >
                Description (Optional)
              </label>
              <Input
                id="newLinkDescription"
                placeholder="Description"
                value={newLinkDescription}
                onChange={(e) => {
                  setNewLinkDescription(e.target.value);
                }}
              />
            </div>

            <div className="col-span-full flex gap-4 lg:col-span-1">
              <div className="h-full w-20">
                <Input
                  type="color"
                  className="h-full"
                  value={newLinkBgColor}
                  onChange={(e) => {
                    setNewLinkBgColor(e.target.value);
                  }}
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="newLinkBgColor"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Bg Color
                </label>
                <Input
                  id="newLinkBgColor"
                  placeholder="Color"
                  value={newLinkBgColor}
                  onChange={(e) => {
                    setNewLinkBgColor(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="col-span-full flex gap-4 lg:col-span-1">
              <div className="h-full w-20">
                <Input
                  type="color"
                  className="h-full"
                  value={newLinkFgColor}
                  onChange={(e) => {
                    setNewLinkFgColor(e.target.value);
                  }}
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="newLinkFgColor"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Fg Color
                </label>
                <Input
                  id="newLinkFgColor"
                  placeholder="Color"
                  value={newLinkFgColor}
                  onChange={(e) => {
                    setNewLinkFgColor(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newLinkIconUrl"
                className="mb-2 block text-sm font-medium text-white"
              >
                Icon
              </label>
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
                {Icons.map((icon) => (
                  <div
                    key={icon.icon}
                    className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 ${
                      newLinkIconUrl === icon.icon
                        ? "border-blue-500 bg-blue-500 bg-opacity-20"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                    onClick={() => setNewLinkIconUrl(icon.icon)}
                  >
                    <Image
                      src={`/profileLinkIcons/${icon.icon}`}
                      alt={icon.name}
                      width={30}
                      height={30}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full mt-4 flex justify-center gap-4">
              <Button
                type="submit"
                className="form_btn_blue flex items-center gap-2"
                disabled={editProfileLinkMutation.isPending}
              >
                <IconDeviceFloppy />
                {editProfileLinkMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
              <Button
                type="button"
                className="form_btn_red flex items-center gap-2"
                onClick={deleteProfileLinkHandler}
                disabled={deleteProfileLinkMutation.isPending}
              >
                <IconTrash />
                {deleteProfileLinkMutation.isPending
                  ? "Deleting..."
                  : "Delete Link"}
              </Button>
            </div>
          </form>
        </div>

        <div className="col-span-full mt-8 flex justify-center">
          <div className="w-full max-w-md">
            <h2 className="mb-4 text-center text-xl font-semibold text-white">
              Preview
            </h2>
            <ProfileLinkElement
              link={{
                ...profileLink,
                title: newLinkTitle,
                url: newLinkUrl,
                description: newLinkDescription,
                bgColor: newLinkBgColor,
                fgColor: newLinkFgColor,
                iconUrl: newLinkIconUrl,
              }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {isOpen && ReactDOM.createPortal(content, document.body)}
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
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProfileLinkMutation.isPending}
            >
              {deleteProfileLinkMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
