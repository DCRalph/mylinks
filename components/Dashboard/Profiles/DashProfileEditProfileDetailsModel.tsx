import { type Profile } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ModelCloseBtn from "components/ModelCloseBtn";
import { api } from "~/utils/api";

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
  const [newProfileSlug, setNewProfileSlug] = useState(profile.slug);

  const profiles = api.profile.getProfiles.useQuery();
  const editProfileMutation = api.profile.editProfile.useMutation();

  const editProfileLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    editProfileMutation.mutate(
      { id: profile.id, name: newProfileName, slug: newProfileSlug },
      {
        onSuccess: () => {
          toast.success("Profile edited successfully", {
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
              <input
                type="text"
                id="newProfileName"
                className="form_input"
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
                htmlFor="newProfileSlug"
                className="mb-2 block text-sm font-medium text-white"
              >
                Slug
              </label>
              <input
                type="text"
                id="newProfileSlug"
                className="form_input"
                placeholder="Slug"
                value={newProfileSlug}
                onChange={(e) => {
                  setNewProfileSlug(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-span-full flex justify-center gap-4">
              <button type="submit" className="form_btn_blue">
                Save
              </button>
              <button className="form_btn_red" type="button">
                Delete
              </button>
            </div>
          </form>
        </div>
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
