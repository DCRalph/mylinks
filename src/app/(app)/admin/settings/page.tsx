import AdminSettings from "~/components/Admin/AdminSettings";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Platform settings" };

export default async function Page() {
  await requirePermission({ platform: ["manage"] });
  await api.platform.settings.prefetch();

  return (
    <HydrateClient>
      <AdminSettings />
    </HydrateClient>
  );
}
