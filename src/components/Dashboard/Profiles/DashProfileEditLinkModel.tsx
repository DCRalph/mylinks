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

interface DashLinkEditModelProps {
  profileLink: ProfileLink;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashProfileEditModel({
  profileLink,
  isOpen,
  setIsOpen,
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
  const editProfileLinkMutation = api.profile.editProfileLink.useMutation();
  const deleteProfileLinkMutation = api.profile.deleteProfileLink.useMutation();

  const editProfileLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    editProfileLinkMutation.mutate(
      {
        id: profileLink.id,
        title: newLinkTitle,
        url: newLinkUrl,
        description: newLinkDescription,
        bgColor: newLinkBgColor,
        fgColor: newLinkFgColor,
        iconUrl: newLinkIconUrl,
      },
      {
        onSuccess: () => {
          toast.success("Link edited successfully", toastOptions);

          setIsClosing(true);
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  const deleteProfileLinkHandler = async () => {
    setIsClosing(true);
    deleteProfileLinkMutation.mutate(
      { id: profileLink.id },
      {
        onSuccess: () => {
          toast.success("Link deleted successfully", toastOptions);

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
                className="form_input"
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
                className="form_input"
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
                className="form_input"
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
                  className="form_input h-full"
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
                  className="form_input"
                  placeholder="Description"
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
                  className="form_input h-full"
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
                  className="form_input"
                  placeholder="Description"
                  value={newLinkFgColor}
                  onChange={(e) => {
                    setNewLinkFgColor(e.target.value);
                  }}
                  required
                />
              </div>
            </div>

            {/* iconUrl */}
            <div className="col-span-full flex items-center gap-4">
              <div className="w-full">
                <label
                  htmlFor="newLinkIconUrl"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Icon URL
                </label>
                <select
                  id="newLinkIconUrl"
                  className="form_input"
                  value={newLinkIconUrl}
                  onChange={(e) => {
                    setNewLinkIconUrl(e.target.value);
                  }}
                  required
                >
                  {Icons.map((icon) => (
                    <option key={icon.name} value={icon.icon}>
                      {icon.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-full flex justify-center">
              <ProfileLinkElement
                key={profileLink.id}
                link={{
                  id: profileLink.id,
                  profileId: "",
                  visible: true,

                  title: newLinkTitle,
                  url: newLinkUrl,
                  description: newLinkDescription,
                  bgColor: newLinkBgColor,
                  fgColor: newLinkFgColor,
                  iconUrl: newLinkIconUrl,
                }}
              />
            </div>

            <div className="col-span-full flex justify-center gap-4">
              <Button
                type="submit"
                className="form_btn_blue flex items-center gap-2"
              >
                Save
                <IconDeviceFloppy size={24} />
              </Button>
              <Button
                className="form_btn_red flex items-center gap-2"
                onClick={deleteProfileLinkHandler}
              >
                Delete
                <IconTrash size={24} />
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
