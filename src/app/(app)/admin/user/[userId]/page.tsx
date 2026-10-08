import { notFound } from "next/navigation";

import AdminUser from "~/components/Admin/AdminUser";
import { requireUser } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "User" };

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requireUser();
  if (!user.admin) notFound();

  const { userId } = await params;
  await api.admin.getUser.prefetch({ userID: userId });

  return (
    <HydrateClient>
      <AdminUser userId={userId} currentUserId={user.id} />
    </HydrateClient>
  );
}
