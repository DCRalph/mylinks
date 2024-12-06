
import {
  SelectItem,
} from "~/components/ui/select";

import { type Bookmark, type BookmarkFolder } from "@prisma/client";



type AllBookmarks = BookmarkFolder & {
  bookmarks: Bookmark[];
  subfolders: AllBookmarks[];
};

const SelectItems = ({
  folder,
  depth,
}: {
  folder: AllBookmarks;
  depth: number;
}) => {
  const newDepth = depth + 1;

  return (
    <>
      <SelectItem value={folder.id}>
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-sm"
            style={{
              backgroundColor: folder.color,
              marginLeft: `${depth * 0.5}rem`,
            }}
          ></div>
          <span>{folder.name}</span>
        </div>
      </SelectItem>

      {folder.subfolders.map((subfolder) => (
        <SelectItems key={subfolder.id} folder={subfolder} depth={newDepth} />
      ))}
    </>
  );
};

export { SelectItems };
export type { AllBookmarks };