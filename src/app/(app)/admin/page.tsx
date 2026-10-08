import { redirect } from "next/navigation";

import AdminOverview from "~/components/Admin/AdminOverview";
import { adminTabs } from "~/components/Admin/tabs";
import { can } from "~/lib/permissions";
import { requireUser } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Admin" };

export default async function Page() {
  const user = await requireUser();
  // Staff without the overview land on the first tab they have.
  if (!can(user, { stats: ["read"] })) {
    redirect(adminTabs(user)[0]?.href ?? "/dashboard");
  }

  await api.admin.overview.prefetch();

  return (
    <HydrateClient>
      <AdminOverview />
    </HydrateClient>
  );
}
