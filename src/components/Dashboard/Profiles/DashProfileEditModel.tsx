import { type Profile, type ProfileLink } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";
import { motion } from "framer-motion";
import DashProfileLink from "./DashProfileLinkListItem";
import ModelCloseBtn from "~/components/ModelCloseBtn";
import DashProfileCreateLinkModel from "./DashProfileCreateLinkModel";
import Link from "next/link";
import { env } from "~/env";

import { Reorder } from "framer-motion";
import DashProfileEditProfileDetailsModel from "./DashProfileEditProfileDetailsModel";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";
import {
  IconPencil,
  IconSquareRoundedPlus,
  IconTrash,
} from "@tabler/icons-react";
import toastOptions from "~/utils/toastOptions";
import { Button } from "~/components/ui/button";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

interface DashLinkEditModelProps {
  profile: Profile_ProjectLinks;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashProfileEditModel({
  profile,
  isOpen,
  setIsOpen,
}: DashLinkEditModelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const profiles = api.profile.getProfiles.useQuery();
  const deleteProfileMutation = api.profile.deleteProfile.useMutation();
  const reorderProfileLinksMutation = api.profile.changeOrder.useMutation();
  const clicks = api.profile.getClicks.useQuery({ id: profile.id });

  const linkOrder = parseProfileLinkOrder({
    linkOrderS: profile.linkOrder,
    profileLinks: profile.profileLinks,
  });

  const [items, setItems] = useState(linkOrder);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reorderTimeout, setReorderTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const deleteProfileHandler = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    deleteProfileMutation.mutate(
      { id: profile.id },
      {
        onSuccess: () => {
          toast.success("Profile deleted successfully", toastOptions);

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
      },
    );
  };

  const reorderHandler = async (items: string[]) => {
    setItems(items);

    if (reorderTimeout) {
      clearTimeout(reorderTimeout);
      setReorderTimeout(null);
    }

    const timeout = setTimeout(() => {
      reorderProfileLinksMutation.mutate(
        { profileId: profile.id, order: items },
        {
          onSuccess: () => {
            toast.success("Profile links reordered successfully", toastOptions);
          },
          onError: (error) => {
            toast.error(error.message, toastOptions);
          },
        },
      );
    }, 1000);

    setReorderTimeout(timeout);
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

  useEffect(() => {
    if (profile.linkOrder) {
      let newOrder = JSON.parse(profile.linkOrder) as string[];

      newOrder = newOrder.filter((item) =>
        profile.profileLinks.find((link) => link.id === item),
      );

      setItems(newOrder);
    }
  }, [profile]);

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
          "relative grid h-fit w-full cursor-auto grid-cols-12 overflow-hidden rounded-2xl bg-zinc-800 p-8 shadow-lg"
        }
      >
        <ModelCloseBtn setIsClosing={setIsClosing} />

        <div className="col-span-full flex flex-col items-center gap-2 text-white">
          <h1 className="text-4xl font-semibold">Profile: {profile.name}</h1>
          <span className="text-lg font-semibold">
            {profile.altName && `${profile.altName}`}
          </span>
          <span className="text-xl">Clicks: {clicks.data?.clicks.length}</span>
          <Link
            href={`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
            target="_blank"
            className="break-all text-sm font-semibold text-blue-500 underline md:text-lg"
          >
            {`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
          </Link>
        </div>

        <div className="col-span-full col-start-1 mx-auto mt-8 flex w-full flex-col justify-center md:col-span-10 md:col-start-2">
          <div className="col-span-full mb-4 flex justify-center gap-4">
            <Button
              className="form_btn_green flex items-center gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <IconSquareRoundedPlus />
              Add Link
            </Button>
            <Button
              className="form_btn_blue flex items-center gap-2"
              onClick={() => setIsEditDetailsOpen(true)}
            >
              <IconPencil />
              Edit Profile
            </Button>
            <Button
              className="form_btn_red flex items-center gap-2"
              onClick={deleteProfileHandler}
            >
              <IconTrash />
              Delete Profile
            </Button>
          </div>

          <Reorder.Group
            axis="y"
            onReorder={reorderHandler}
            values={items}
            className="mt-4 flex flex-col gap-4"
          >
            {items
              .filter((item) =>
                profile.profileLinks.find((link) => link.id === item),
              )
              .map((item) => (
                <Reorder.Item value={item} key={item}>
                  <DashProfileLink
                    key={item}
                    profileLink={
                      profile.profileLinks.find((link) => link.id === item)!
                    }
                  />
                </Reorder.Item>
              ))}
          </Reorder.Group>
        </div>

        <DashProfileCreateLinkModel
          profileId={profile.id}
          isOpen={isCreateOpen}
          setIsOpen={setIsCreateOpen}
        />

        <DashProfileEditProfileDetailsModel
          profile={profile}
          isOpen={isEditDetailsOpen}
          setIsOpen={setIsEditDetailsOpen}
        />
      </motion.div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete this profile and all its links?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button
              variant="default"
              className="form_btn_white"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="form_btn_red"
            >
              Confirm Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );

  if (!isOpen) return <></>;

  const rootElement = document.getElementById("rootBody");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  return ReactDOM.createPortal(content, rootElement);
}
