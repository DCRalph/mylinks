import { type Profile } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ModelCloseBtn from "~/components/ModelCloseBtn";
import { api } from "~/trpc/react";
import { IconDeviceFloppy } from "@tabler/icons-react";
import toastOptions from "~/utils/toastOptions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface DashEditProfileDetailsModelProps {
  profile: Profile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashEditProfileDetailsModel({
  profile,
  isOpen,
  setIsOpen,
}: DashEditProfileDetailsModelProps) {
  const [isClosing, setIsClosing] = useState(false);

  const [newProfileName, setNewProfileName] = useState(profile.name);
  const [newProfileAltName, setNewProfileAltName] = useState(profile.altName);
  const [newProfileSlug, setNewProfileSlug] = useState(profile.slug);
  const [newProfileBio, setNewProfileBio] = useState(profile.bio);

  const profiles = api.profile.getProfiles.useQuery();
  const editProfileMutation = api.profile.editProfile.useMutation();

  const editProfileLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newProfileAltName == "") setNewProfileAltName(null);
    if (newProfileBio == "") setNewProfileBio(null);

    editProfileMutation.mutate(
      {
        id: profile.id,
        name: newProfileName,
        altName: newProfileAltName,
        slug: newProfileSlug,
        bio: newProfileBio,
      },
      {
        onSuccess: () => {
          toast.success("Profile edited successfully", toastOptions);

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
          <h1 className="text-4xl font-semibold">Edit details</h1>
        </div>

        <div className="col-span-full col-start-1 mx-auto mt-8 flex w-full justify-center md:col-span-6 md:col-start-4">
          <form
            onSubmit={editProfileLinkHandler}
            className="grid w-full grid-cols-2 gap-4"
          >
            <div className="col-span-full">
              <label
                htmlFor="newProfileName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Name
              </label>
              <Input
                type="text"
                id="newProfileName"
                placeholder="Name"
                value={newProfileName}
                onChange={(e) => {
                  setNewProfileName(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newProfileAltName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Alt Name (Optional and only visible to you)
              </label>
              <Input
                type="text"
                id="newProfileAltName"
                placeholder="Alt Name"
                value={newProfileAltName ?? ""}
                onChange={(e) => {
                  setNewProfileAltName(e.target.value);
                }}
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newProfileSlug"
                className="mb-2 block text-sm font-medium text-white"
              >
                Slug
              </label>
              <Input
                type="text"
                id="newProfileSlug"
                placeholder="Slug"
                value={newProfileSlug}
                onChange={(e) => {
                  setNewProfileSlug(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newProfileBio"
                className="mb-2 block text-sm font-medium text-white"
              >
                Bio (Optional)
              </label>
              <textarea
                id="newProfileBio"
                className="h-64"
                placeholder="Bio"
                value={newProfileBio ?? ""}
                onChange={(e) => {
                  setNewProfileBio(e.target.value);
                }}
              />
            </div>

            <div className="col-span-full flex justify-center gap-4">
              <Button
                type="submit"
                className="form_btn_blue flex items-center gap-2"
              >
                <IconDeviceFloppy />
                Save
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );

  if (!isOpen) return <></>;

  const rootElement = document.getElementById("rootBody");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  return ReactDOM.createPortal(content, rootElement);
}
