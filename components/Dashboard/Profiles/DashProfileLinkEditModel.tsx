import { type ProfileLink } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'
import ModelCloseBtn from "components/ModelCloseBtn";
import { api } from "~/utils/api";
import ProfileLinkElement from "components/ProfilePage/ProfileLink";



interface DashLinkEditModelProps {
  profileLink: ProfileLink;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashProfileEditModel({ profileLink, isOpen, setIsOpen }: DashLinkEditModelProps) {

  const [isClosing, setIsClosing] = useState(false)

  const [newLinkTitle, setNewLinkTitle] = useState(profileLink.title)
  const [newLinkUrl, setNewLinkUrl] = useState(profileLink.url)
  const [newLinkShowenUrl, setNewLinkShowenUrl] = useState(profileLink.showenUrl)
  const [newLinkBgColor, setNewLinkBgColor] = useState(profileLink.bgColor ?? "")
  const [newLinkFgColor, setNewLinkFgColor] = useState(profileLink.fgColor ?? "")
  const [newLinkIconUrl, setNewLinkIconUrl] = useState(profileLink.iconUrl ?? "www.png")

  const profiles = api.profile.getProfiles.useQuery();
  const editProfileLinkMutation = api.profile.editProfileLink.useMutation();
  const deleteProfileLinkMutation = api.profile.deleteProfileLink.useMutation();

  const editProfileLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    editProfileLinkMutation.mutate({ id: profileLink.id, title: newLinkTitle, url: newLinkUrl, showenUrl: newLinkShowenUrl, bgColor: newLinkBgColor, fgColor: newLinkFgColor, iconUrl: newLinkIconUrl }, {
      onSuccess: () => {
        toast.success('Link edited successfully', {
          closeOnClick: true,
          pauseOnHover: true,
        });

        setIsClosing(true)
      },
      onError: (error) => {
        toast.error(error.message, {
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    });
  }

  const deleteProfileLinkHandler = async () => {
    deleteProfileLinkMutation.mutate({ id: profileLink.id }, {
      onSuccess: () => {
        toast.success('Link deleted successfully', {
          closeOnClick: true,
          pauseOnHover: true,
        });

        setIsClosing(true)
        profiles.refetch()
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
      }
    });
  }

  useEffect(() => {
    const body = document.querySelector('body')

    if (isOpen) {
      body!.style.overflowY = 'hidden'
    } else {
      body!.style.overflowY = 'scroll'
    }
  }, [isOpen])

  useEffect(() => {
    if (isClosing) {
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 300)
    }
  }, [isClosing, setIsOpen])

  const content: ReactNode = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
      className={
        'fixed inset-0 z-50 h-screen p-4 md:p-16 bg-black bg-opacity-25 backdrop-blur-lg overflow-y-scroll flex justify-center cursor-pointer'
      }
      onClick={() => setIsClosing(true)}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={isClosing ? { y: '80vh', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, mass: 0.75 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className={
          'w-full m-8 h-fit p-8 grid grid-cols-12 rounded-2xl overflow-hidden bg-zinc-800 shadow-lg cursor-auto relative'
        }>
        <ModelCloseBtn setIsClosing={setIsClosing} />


        <div className="col-span-full text-white flex justify-center">
          <h1 className="text-4xl font-semibold underline">{newLinkTitle}</h1>
        </div>

        <div className="col-span-full md:col-span-6 w-full col-start-1 md:col-start-4 mx-auto flex justify-center mt-8">
          <form onSubmit={editProfileLinkHandler} className="grid grid-cols-2 gap-4 w-full">


            <div className="col-span-full">
              <label htmlFor="newLinkName" className="block mb-2 text-sm font-medium text-white">Name</label>
              <input type="text" id="newLinkName" className="form_input" placeholder="Name" value={newLinkTitle} onChange={(e) => { setNewLinkTitle(e.target.value) }} required />
            </div>

            <div className="col-span-full">
              <label htmlFor="newLinkUrl" className="block mb-2 text-sm font-medium text-white">URL</label>
              <input type="text" id="newLinkUrl" className="form_input" placeholder="URL" value={newLinkUrl} onChange={(e) => { setNewLinkUrl(e.target.value) }} required />
            </div>

            <div className="col-span-full">
              <label htmlFor="newLinkShowenUrl" className="block mb-2 text-sm font-medium text-white">Showen URL</label>
              <input id="newLinkShowenUrl" className="form_input" placeholder="Showen URL" value={newLinkShowenUrl} onChange={(e) => { setNewLinkShowenUrl(e.target.value) }} required />
            </div>

            <div className="col-span-full lg:col-span-1 flex gap-4">
              <div className="h-full w-20">
                <input type="color" className="form_input h-full" value={newLinkBgColor} onChange={(e) => { setNewLinkBgColor(e.target.value) }} />
              </div>
              <div className="w-full">
                <label htmlFor="newLinkBgColor" className="block mb-2 text-sm font-medium text-white">Bg Color</label>
                <input id="newLinkBgColor" className="form_input" placeholder="Showen URL" value={newLinkBgColor} onChange={(e) => { setNewLinkBgColor(e.target.value) }} required />
              </div>
            </div>

            <div className="col-span-full lg:col-span-1 flex gap-4">
              <div className="h-full w-20">
                <input type="color" className="form_input h-full" value={newLinkFgColor} onChange={(e) => { setNewLinkFgColor(e.target.value) }} />
              </div>
              <div className="w-full">
                <label htmlFor="newLinkFgColor" className="block mb-2 text-sm font-medium text-white">Fg Color</label>
                <input id="newLinkFgColor" className="form_input" placeholder="Showen URL" value={newLinkFgColor} onChange={(e) => { setNewLinkFgColor(e.target.value) }} required />
              </div>
            </div>


            {/* iconUrl */}
            <div className="col-span-full flex items-center gap-4">

              <div className="w-full">
                <label htmlFor="newLinkIconUrl" className="block mb-2 text-sm font-medium text-white">Icon URL</label>
                <select id="newLinkIconUrl" className="form_input" value={newLinkIconUrl} onChange={(e) => { setNewLinkIconUrl(e.target.value) }} required>
                  <option value="generic.png">Generic</option>
                  <option value="github.png">Github</option>
                  <option value="instagram.png">Instagram</option>
                  <option value="linkedin.png">Linkedin</option>
                  <option value="twitter.svg">Twitter</option>
                  <option value="youtube.png">Youtube</option>
                </select>

              </div>

              {/* <div className="aspect-square flex justify-center items-center h-16 rounded-lg bg-zinc-700 p-2">
                <Image
                  src={"/profileLinkIcons/" + newLinkIconUrl}
                  alt={profileLink.title}
                  width={100}
                  height={100}
                />
              </div> */}
            </div>

            <div className="col-span-full flex justify-center">

              <ProfileLinkElement key={profileLink.id} link={{
                id: profileLink.id,
                order: 0,
                profileId: "",

                title: newLinkTitle,
                url: newLinkUrl,
                showenUrl: newLinkShowenUrl,
                bgColor: newLinkBgColor,
                fgColor: newLinkFgColor,
                iconUrl: newLinkIconUrl,
              }} />

            </div>

            <div className="col-span-full flex justify-center gap-4">
              <button type="submit" className="form_btn_blue">Save</button>
              <button className="form_btn_red" type="button" onClick={deleteProfileLinkHandler}>Delete</button>
            </div>
          </form>
        </div>

      </motion.div >
    </motion.div >
  );

  if (!isOpen) return <></>

  const rootElement = document.getElementById('__next');
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  return ReactDOM.createPortal(content, rootElement);
}

