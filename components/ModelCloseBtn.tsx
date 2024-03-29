import { type Dispatch, type SetStateAction } from "react"

export default function ModelCloseBtn({ setIsClosing }: { setIsClosing: Dispatch<SetStateAction<boolean>> }) {
  return (
    <button className="absolute h-10 aspect-square bg-red-600 rounded-lg top-4 right-4" onClick={() => { setIsClosing(true) }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  )
}