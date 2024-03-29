import { type Profile, type ProfileLink } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'
import DashProfileLink from "./DashProfileLink";
import ModelCloseBtn from "components/ModelCloseBtn";


interface DashLinkEditModelProps {
  profileLink: ProfileLink;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashProfileEditModel({ profileLink, isOpen, setIsOpen }: DashLinkEditModelProps) {

  const [isClosing, setIsClosing] = useState(false)


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
          'w-full m-16 h-fit p-8 grid grid-cols-12 rounded-2xl overflow-hidden bg-zinc-800 shadow-lg cursor-auto relative'
        }>
        <ModelCloseBtn setIsClosing={setIsClosing} />


        <div className="col-span-full text-white flex justify-center">
          <h1 className="text-4xl font-semibold underline">{profileLink.title}</h1>
        </div>

        <div className="col-span-full md:col-span-10 w-full col-start-1 md:col-start-2 mx-auto flex flex-col gap-4 justify-center mt-8">


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

