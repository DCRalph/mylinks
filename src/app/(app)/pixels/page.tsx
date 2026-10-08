import { notFound } from "next/navigation";

import PixelsBoard from "~/components/Pixels/PixelsBoard";
import { requireUser } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Pixels" };

export default async function Page() {
  const user = await requireUser();
  if (!user.spyPixel && !user.admin) notFound();

  await api.spypixel.getAll.prefetch();

  return (
    <HydrateClient>
      <PixelsBoard />
    </HydrateClient>
  );
}
