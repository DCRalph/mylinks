// app/bookmarks/page.tsx

"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import FolderItem from "~/components/Bookmarks/FolderItem";
import BookmarkItem from "~/components/Bookmarks/BookmarkItem";
import { api } from "~/trpc/react";

export default function BookmarksPage() {
  const myUser = api.user.getUser.useQuery();
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  // const rootFolderQuery = api.bookmarks.getRootFolder.useQuery();
  const currentFolder = api.bookmarks.getFolder.useQuery({
    folderId: currentFolderId,
  });

  const handleFolderClick = async (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const goBack = async () => {
    if (currentFolder?.data?.parentFolderId) {
      setCurrentFolderId(currentFolder.data?.parentFolderId);
    } else {
      setCurrentFolderId("root"); // Go back to root
    }
  };

  if (!currentFolder) return <p>Loading...</p>;

  return (
    <>
      <Head>
        <title>link2it | Bookmarks</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 flex justify-center">
          <h1 className="text-5xl font-bold text-white">Bookmarks</h1>
        </div>

        <div className="flex flex-col items-center py-8">
          {currentFolder?.data?.parentFolderId && (
            <button onClick={goBack} className="mb-4 text-blue-400">
              &larr; Go Back
            </button>
          )}

          <div className="grid grid-cols-4 gap-4">
            {currentFolder.data?.subfolders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onClick={() => handleFolderClick(folder.id)}
              />
            ))}
            {currentFolder.data?.bookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
              />
            ))}
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
