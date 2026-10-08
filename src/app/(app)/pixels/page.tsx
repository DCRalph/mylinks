import PixelsBoard from "~/components/Pixels/PixelsBoard";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Pixels" };

export default async function Page() {
  await requirePermission({ pixel: ["use"] });
  await api.spypixel.getAll.prefetch();

  return (
    <HydrateClient>
      <PixelsBoard />
    </HydrateClient>
  );
}
