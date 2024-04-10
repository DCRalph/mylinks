import { type Profile, type ProfileLink } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { api } from "~/utils/api";
import { motion } from "framer-motion";
import DashProfileLink from "./DashProfileLinkListItem";
import ModelCloseBtn from "components/ModelCloseBtn";
import DashProfileCreateLinkModel from "./DashProfileCreateLinkModel";
import Link from "next/link";
import { env } from "~/env";

import { Reorder } from "framer-motion";
import { set } from "zod";

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
  const [isClosing, setIsClosing] = useState(false);

  const profiles = api.profile.getProfiles.useQuery();
  const deleteProfileMutation = api.profile.deleteProfile.useMutation();
  const reorderProfileLinksMutation = api.profile.changeOrder.useMutation();

  const linkOrderS = profile.linkOrder as string | null;
  let linkOrder: string[] | null = null;

  if (linkOrderS === null) {
    linkOrder = profile.profileLinks.map((link) => link.id);
  } else {
    linkOrder = JSON.parse(linkOrderS) as string[];
  }

  const [items, setItems] = useState(linkOrder);

  const deleteProfileHandler = async () => {
    deleteProfileMutation.mutate(
      { id: profile.id },
      {
        onSuccess: () => {
          toast.success("Profile deleted successfully", {
            closeOnClick: true,
            pauseOnHover: true,
          });

          setIsClosing(true);
          profiles
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, {
                closeOnClick: true,
                pauseOnHover: true,
              });
            });
        },
        onError: (error) => {
          toast.error(error.message, {
            closeOnClick: true,
            pauseOnHover: true,
          });
        },
      },
    );
  };

  const [reorderTimeout, setReorderTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

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
            toast.success("Profile links reordered successfully", {
              closeOnClick: true,
              pauseOnHover: true,
            });
          },
          onError: (error) => {
            toast.error(error.message, {
              closeOnClick: true,
              pauseOnHover: true,
            });
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
      const newOrder = JSON.parse(profile.linkOrder as string) as string[];
      setItems(newOrder);
    }
  }, [profile.linkOrder]);

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
        animate={isClosing ? { y: "80vh", opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 12, mass: 0.75 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className={
          "relative grid h-fit w-full cursor-auto grid-cols-12 overflow-hidden rounded-2xl bg-zinc-800 p-8 shadow-lg"
        }
      >
        <ModelCloseBtn setIsClosing={setIsClosing} />

        <div className="col-span-full flex flex-col items-center gap-2 text-white">
          <h1 className="text-4xl font-semibold underline">{profile.name}</h1>
          <Link
            href={`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
            target="_blank"
            className="break-all text-sm font-semibold text-blue-500 underline md:text-lg"
          >
            {`${env.NEXT_PUBLIC_DOMAIN}/p/${profile.slug}`}
          </Link>
        </div>

        <div className="col-span-full col-start-1 mx-auto mt-8 flex w-full flex-col justify-center gap-4 md:col-span-10 md:col-start-2">
          <div className="col-span-full mb-4 flex justify-center gap-4">
            <button
              className="form_btn_green"
              type="button"
              onClick={() => setIsCreateOpen(true)}
            >
              Add Link
            </button>
            <button
              className="form_btn_blue"
              type="button"
              onClick={() => null}
            >
              Edit Profile
            </button>
            <button
              className="form_btn_red"
              type="button"
              onClick={deleteProfileHandler}
            >
              Delete Profile
            </button>
          </div>

          <Reorder.Group
            axis="y"
            onReorder={reorderHandler}
            values={items}
            className="flex flex-col gap-4"
          >
            {items.map((item) => (
              <Reorder.Item value={item} key={item}>
                <DashProfileLink
                  key={item}
                  profileLink={
                    profile.profileLinks.find((link) => link.id === item)!
                  }
                />
                {/* <span>{item}</span> */}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>

        <DashProfileCreateLinkModel
          profileId={profile.id}
          isOpen={isCreateOpen}
          setIsOpen={setIsCreateOpen}
        />
      </motion.div>
    </motion.div>
  );

  if (!isOpen) return <></>;

  const rootElement = document.getElementById("__next");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  return ReactDOM.createPortal(content, rootElement);
}
