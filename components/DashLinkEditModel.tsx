import { type Link } from "@prisma/client";
import { useEffect, useState, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'


interface DashLinkEditModelProps {
  url: Link;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function DashLinkEditModel({ url, isOpen, setIsOpen }: DashLinkEditModelProps) {

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
          'w-full max-w-2xl h-fit rounded-2xl overflow-hidden bg-zinc-700 shadow-lg cursor-auto relative'
        }>


        <div className="p-6 text-white">
          <h4 className="text-4xl font-semibold">{url.name}</h4>
          <h4 className="text-4xl font-semibold">{url.slug}</h4>
          <h4 className="text-4xl font-semibold">{url.url}</h4>
          <h4 className="text-4xl font-semibold">{url.id}</h4>
          <h4 className="text-4xl font-semibold">{url.isUserLink ? "yes" : "no"}</h4>

          {/* <div className="flex flex-wrap gap-4 text-white  text-base mb-6">
            <DateText
              publishedAt={url.createdAt}
              updatedAt={url.updatedAt}
            />
          </div> */}


          <div className="w-full h-1 rounded-full opacity-50 bg-text mt-6"></div>


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

