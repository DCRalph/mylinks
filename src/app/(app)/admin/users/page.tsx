import AdminUsers from "~/components/Admin/AdminUsers";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Users" };

export default async function Page() {
  await requirePermission({ user: ["list"] });
  await api.admin.getUsers.prefetch({ search: "", filter: "all" });

  return (
    <HydrateClient>
      <AdminUsers />
    </HydrateClient>
  );
}
