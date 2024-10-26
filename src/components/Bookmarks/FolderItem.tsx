// components/FolderItem.tsx
import { type BookmarkFolder } from "@prisma/client";
import { IconDotsVertical } from "@tabler/icons-react";
interface FolderProps {
  folder: BookmarkFolder;
  onClick: () => void;
}

const FolderItem = ({ folder, onClick }: FolderProps) => {
  return (
    <div className="group relative m-2 flex h-24 w-24 cursor-pointer items-center justify-center rounded-md bg-green-600 text-white">
      <div onClick={onClick} className="flex-1 text-center">
        {folder.name}
      </div>
      <div className="absolute right-2 top-2">
        <button className="text-white opacity-0 group-hover:opacity-100">
          <IconDotsVertical />
        </button>
      </div>
    </div>
  );
};

export default FolderItem;
