import { requireUser } from "~/server/guards";
import BookmarksPage from "./bookmarks";

export default async function Page() {
  await requireUser();
  return <BookmarksPage />;
}
