import { SelectItem } from "~/components/ui/select";

import { type AppRouter } from "~/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";

// type AllBookmarks = BookmarkFolder & {
//   bookmarks: Bookmark[];
//   subfolders: AllBookmarks[];
// };

type AllBookmarks = inferProcedureOutput<
  AppRouter["bookmarks"]["getAllBookmarks"]
>;

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
        <SelectItems
          key={subfolder.id}
          folder={subfolder as unknown as AllBookmarks} // i hate this but it works
          depth={newDepth}
        />
      ))}
    </>
  );
};

export { SelectItems };
export type { AllBookmarks };
