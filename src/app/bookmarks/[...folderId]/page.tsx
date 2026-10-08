import { requireUser } from "~/server/guards";
import BookmarksPage from "../bookmarks";

export default async function Page() {
  // The client component reads the folder id from the URL.
  await requireUser();
  return <BookmarksPage />;
}
