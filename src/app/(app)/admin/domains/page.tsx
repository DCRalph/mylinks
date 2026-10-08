import AdminDomains from "~/components/Admin/AdminDomains";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Domains" };

export default async function Page() {
  await requirePermission({ domain: ["manage"] });
  await api.platform.domains.prefetch();

  return (
    <HydrateClient>
      <AdminDomains />
    </HydrateClient>
  );
}
