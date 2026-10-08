import BookmarksBrowser from "~/components/Bookmarks/BookmarksBrowser";
import { can } from "~/lib/permissions";
import { requireUser } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Bookmarks" };

export default async function Page({
  params,
}: {
  params: Promise<{ folderId?: string[] }>;
}) {
  const user = await requireUser();
  const folderId = (await params).folderId?.at(-1) ?? null;

  await Promise.all([
    api.bookmarks.getFolder.prefetch({ folderId }),
    api.bookmarks.getFolderPath.prefetch({ folderId }),
  ]);

  return (
    <HydrateClient>
      <BookmarksBrowser
        folderId={folderId}
        canAddSamples={can(user, { platform: ["manage"] })}
      />
    </HydrateClient>
  );
}
