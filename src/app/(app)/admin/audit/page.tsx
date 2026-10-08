import AdminAudit from "~/components/Admin/AdminAudit";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Audit log" };

export default async function Page() {
  await requirePermission({ audit: ["read"] });
  await api.admin.auditLog.prefetchInfinite({ search: "" });

  return (
    <HydrateClient>
      <AdminAudit />
    </HydrateClient>
  );
}
