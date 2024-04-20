import { type Link } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import ModelCloseBtn from "components/ModelCloseBtn";
import { api } from "~/utils/api";

interface DashLinkEditModelProps {
  link: Link;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashLinkEditModel({
  link,
  isOpen,
  setIsOpen,
}: DashLinkEditModelProps) {
  const [isClosing, setIsClosing] = useState(false);

  const [UrlName, setUrlName] = useState(link.name);
  const [UrllongUrl, setUrlLongUrl] = useState(link.url);
  const [UrlshortUrl, setUrlShortUrl] = useState(link.slug);

  const myLinks = api.link.getMyLinks.useQuery();
  const editLinkMutation = api.link.editLink.useMutation();
  const deleteLinkMutation = api.link.deleteLink.useMutation();
  const clicks = api.link.getClicks.useQuery({ id: link.id });

  const editLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    editLinkMutation.mutate(
      { id: link.id, name: UrlName, url: UrllongUrl, slug: UrlshortUrl },
      {
        onSuccess: () => {
          toast.success("Link edited successfully", {
            closeOnClick: true,
            pauseOnHover: true,
          });

          setIsClosing(true);
          myLinks
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

  const deleteLinkHandler = async () => {
    deleteLinkMutation.mutate(
      { id: link.id },
      {
        onSuccess: () => {
          toast.success("Link deleted successfully", {
            closeOnClick: true,
            pauseOnHover: true,
          });

          setIsClosing(true);
          myLinks
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
          "relative grid h-fit w-full cursor-auto grid-cols-12 overflow-hidden rounded-2xl bg-zinc-800 p-8 shadow-lg"
        }
      >
        <ModelCloseBtn setIsClosing={setIsClosing} />

        <div className="col-span-full flex flex-col gap-4 items-center text-white">
          <h1 className="text-4xl font-semibold">Edit Link</h1>
          <h2 className="text-xl">Clicks: {clicks.data?.clicks.length}</h2>
        </div>

        <div className="col-span-full col-start-1 mx-auto mt-8 flex w-full justify-center md:col-span-6 md:col-start-4">
          <form
            onSubmit={editLinkHandler}
            className="grid w-full grid-cols-2 gap-4"
          >
            <div className="col-span-full">
              <label
                htmlFor="newName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Name
              </label>
              <input
                placeholder="Name"
                type="text"
                id="newName"
                className="form_input"
                value={UrlName}
                onChange={(e) => setUrlName(e.target.value)}
                required
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newShortUrl"
                className="mb-2 block text-sm font-medium text-white"
              >
                Slug
              </label>
              <input
                placeholder="Slug"
                type="text"
                id="newShortUrl"
                className="form_input"
                value={UrlshortUrl}
                onChange={(e) => setUrlShortUrl(e.target.value)}
                required
              />
            </div>

            <div className="col-span-full">
              <label
                htmlFor="newLongUrl"
                className="mb-2 block text-sm font-medium text-white"
              >
                Long Url
              </label>
              <input
                placeholder="Long Url"
                type="text"
                id="newLongUrl"
                className="form_input"
                value={UrllongUrl}
                onChange={(e) => setUrlLongUrl(e.target.value)}
                required
              />
            </div>

            <div className="col-span-full flex justify-center gap-4">
              <button className="form_btn_blue" type="submit">
                Save
              </button>
              <button
                className="form_btn_red"
                type="button"
                onClick={deleteLinkHandler}
              >
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
