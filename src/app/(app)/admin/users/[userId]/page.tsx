import AdminUser from "~/components/Admin/AdminUser";
import { requirePermission } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "User" };

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewer = await requirePermission({ user: ["get"] });
  const { userId } = await params;
  await api.admin.getUser.prefetch({ userID: userId });

  return (
    <HydrateClient>
      <AdminUser
        userId={userId}
        viewer={{ id: viewer.id, role: viewer.role }}
      />
    </HydrateClient>
  );
}
