import AdminLinks from "~/components/Admin/AdminLinks";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Links" };

export default async function Page() {
  await requirePermission({ link: ["moderate"] });
  await api.moderation.links.prefetch({ search: "", filter: "all", sort: "newest" });

  return (
    <HydrateClient>
      <AdminLinks />
    </HydrateClient>
  );
}
