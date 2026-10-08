import { notFound } from "next/navigation";

import AdminUsers from "~/components/Admin/AdminUsers";
import { requireUser } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Admin" };

export default async function Page() {
  const user = await requireUser();
  if (!user.admin) notFound();

  await api.admin.getUsers.prefetch();

  return (
    <HydrateClient>
      <AdminUsers />
    </HydrateClient>
  );
}
