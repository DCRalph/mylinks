import { type Link } from "@prisma/client";
import { toast } from 'react-toastify';


const editBtn = (url: Link) => {
  toast.info(url.id);
}


export default function DashLink({ url }: { url: Link }) {

  return (
    <div className=" bg-white rounded-lg w-full flex flex-col px-4 py-2">
      <div className="flex justify-between">
        <div className="flex flex-col justify-between">
          <span className="text-lg font-semibold">{url.url}</span>
          <span className="text-lg font-semibold">{url.slug}</span>
        </div>

        <div className="flex items-center">
          <button className="px-4 h-10 rounded-lg bg-blue-500" onClick={() => {
            // alert(url.id)
            editBtn(url)
          }}>Edit</button>
        </div>
      </div>

    </div>
  );

}

