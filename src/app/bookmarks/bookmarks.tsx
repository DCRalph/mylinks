// app/bookmarks/page.tsx

"use client";

import { useState } from "react";
import Head from "next/head";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import FolderItem from "~/components/Bookmarks/FolderItem";
import BookmarkItem from "~/components/Bookmarks/BookmarkItem";
import { api } from "~/trpc/react";
import {
  IconArrowBackUp,
  IconFolderFilled,
  IconReload,
  IconSquareRoundedPlus,
} from "@tabler/icons-react";
import SkeletonItem from "~/components/Bookmarks/SkeletonItem";
import { Button } from "~/components/ui/button";
import AddBookmark from "~/components/Bookmarks/AddBookmark";
import AddFolder from "~/components/Bookmarks/AddFolder";

export default function BookmarksPage() {
  const utils = api.useUtils();
  const myUser = api.user.getUser.useQuery();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const currentFolder = api.bookmarks.getFolder.useQuery({
    folderId: currentFolderId,
  });
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);

  const handleFolderClick = async (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const goBack = async () => {
    if (currentFolder?.data?.parentFolderId) {
      setCurrentFolderId(currentFolder.data?.parentFolderId);
    } else {
      setCurrentFolderId(null); // Go back to root
    }
  };

  return (
    <>
      <Head>
        <title>link2it | Bookmarks</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-8 flex justify-center">
          <h1 className="text-5xl font-bold text-white">Bookmarks</h1>
        </div>

        {/* create bookmark */}
        <div className="px-8 mt-8 flex flex-wrap w-full justify-center gap-2 md:gap-4 xl:px-16">
          <Button
            className="form_btn_blue flex items-center gap-2 "
            onClick={() => setAddBookmarkOpen(true)}
            size={"sm"}
          >
            <IconSquareRoundedPlus />
            Add Bookmark
          </Button>

          <Button
            className="form_btn_blue flex items-center gap-2"
            onClick={() => setAddFolderOpen(true)}
            size={"sm"}
          >
            <IconSquareRoundedPlus />
            Add Folder
          </Button>

          <Button
            className="form_btn_blue flex items-center gap-2"
            onClick={async () => {
              await utils.bookmarks.getFolder.invalidate().catch(console.error);
              await utils.bookmarks.getFolder.reset().catch(console.error);
            }}
            size={"sm"}
          >
            <IconReload />
            Refresh
          </Button>
        </div>

        <div className="flex w-full flex-col px-8 py-8 xl:px-16">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentFolder.isLoading && (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonItem key={index} index={index} />
                ))}
              </>
            )}
            {!currentFolder.isLoading && (
              <>
                {/* {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonItem key={index} index={index} />
                ))} */}
                {currentFolder?.data?.parentFolderId && (
                  <FolderItem
                    key={"goback"}
                    icon={<IconArrowBackUp className="h-full w-full" />}
                    bgColor="#FF402F"
                    onClick={() => goBack()}
                  />
                )}
                {currentFolder.data?.subfolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    icon={<IconFolderFilled className="h-full w-full" />}
                    bgColor={folder.color}
                    onClick={() => handleFolderClick(folder.id)}
                  />
                ))}
                {currentFolder.data?.bookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    bgColor={bookmark.color}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <Footer />
      </main>

      <AddBookmark
        isOpen={addBookmarkOpen}
        setIsOpen={setAddBookmarkOpen}
        currentFolderId={currentFolder.data?.id ?? ""}
      />

      <AddFolder
        isOpen={addFolderOpen}
        setIsOpen={setAddFolderOpen}
        currentFolderId={currentFolder.data?.id ?? ""}
      />
    </>
  );
}
