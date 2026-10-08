"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api, type RouterOutputs } from "~/trpc/react";

type Tree = RouterOutputs["bookmarks"]["getAllBookmarks"];
type Option = { id: string; name: string; depth: number };

/** Depth-first list of folders, skipping `exclude` and everything inside it. */
function flatten(folder: Tree, exclude: string | undefined, depth = 0): Option[] {
  if (folder.id === exclude) return [];
  return [
    { id: folder.id, name: depth === 0 ? "Bookmarks" : folder.name, depth },
    ...folder.subfolders.flatMap((child) =>
      flatten(child, exclude, depth + 1),
    ),
  ];
}

/** Picks a destination folder. `exclude` hides a folder and its subtree. */
export default function FolderSelect({
  id,
  value,
  onChange,
  exclude,
}: {
  id?: string;
  value: string;
  onChange: (folderId: string) => void;
  exclude?: string;
}) {
  const tree = api.bookmarks.getAllBookmarks.useQuery();
  const options = tree.data ? flatten(tree.data, exclude) : [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Choose a folder" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            <span style={{ paddingLeft: option.depth * 14 }}>{option.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
