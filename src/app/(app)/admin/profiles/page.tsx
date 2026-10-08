import AdminProfiles from "~/components/Admin/AdminProfiles";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Profiles" };

export default async function Page() {
  await requirePermission({ profile: ["moderate"] });
  await api.moderation.profiles.prefetch({ search: "", filter: "all", sort: "newest" });

  return (
    <HydrateClient>
      <AdminProfiles />
    </HydrateClient>
  );
}
