import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { checkRequireSetup } from "~/utils/requireSetup";
import React from "react";
import BookmarksPage from "../bookmarks";

export default async function BookmarksFolderPage({
  params,
}: {
  params: { folderId: string[] };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // User is not authenticated, redirect to home page
    redirect("/");
  }

  const needsSetup = await checkRequireSetup();

  if (needsSetup) {
    // User needs to complete setup, redirect to setup page
    redirect("/setup");
  }

  // The folder ID is passed through the URL, but we'll let the client component handle it
  return <BookmarksPage />;
}
