import { type Dispatch, type SetStateAction } from "react"
import { Button } from "./ui/button"

export default function ModelCloseBtn({ setIsClosing }: { setIsClosing: Dispatch<SetStateAction<boolean>> }) {
  return (
    <div className="absolute h-10 aspect-square top-4 right-4">
      <Button className="text-sm rounded-lg block w-full p-2.5 bg-zinc-700 border border-zinc-600 placeholder-zinc-400 text-white" onClick={() => { setIsClosing(true) }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  )
}