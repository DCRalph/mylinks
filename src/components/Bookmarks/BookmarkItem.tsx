// components/BookmarkItem.tsx

import { type Bookmark } from "@prisma/client";
import { IconDotsVertical } from "@tabler/icons-react";

interface BookmarkProps {
  bookmark: Bookmark;
}

const BookmarkItem = ({ bookmark }: BookmarkProps) => {
  const openBookmark = () => {
    window.open(bookmark.url, "_blank");
  };

  return (
    <div className="group relative m-2 flex h-24 w-24 cursor-pointer items-center justify-center rounded-md bg-blue-600 text-white">
      <div onClick={openBookmark} className="flex-1 text-center">
        {bookmark.name}
      </div>
      <div className="absolute right-2 top-2">
        <button className="text-white opacity-0 group-hover:opacity-100">
          <IconDotsVertical />
        </button>
      </div>
    </div>
  );
};

export default BookmarkItem;
