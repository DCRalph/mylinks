import { IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";


const copyToClipboard = (str: string) => {
  navigator.clipboard
    .writeText(str)

    .then(() => {
      console.log("copyed");
    })

    .catch((error) => {
      console.log(error);
    });
};

export default function Copy({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleCopyClick = async () => {
    copyToClipboard(text);
    setIsCopied(true);

    toast.success("Copied to clipboard", toastOptions);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      setIsCopied(false);
      setTimeoutId(null);
    }, 2000);

    setTimeoutId(id);
  };

  return (
    <button onClick={handleCopyClick}>
      <IconCopy
        className={`transition-all duration-300 ease-in-out hover:scale-125 active:scale-90 font-extrabold ${isCopied ? "text-green-500" : "text-white"
          }`}
      />
    </button>
  );
}
