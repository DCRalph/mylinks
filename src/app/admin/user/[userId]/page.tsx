import { notFound } from "next/navigation";

import { requireUser } from "~/server/guards";
import AdminUser from "./AdminUser";

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requireUser();
  if (!user.admin) notFound();
  return <AdminUser params={params} />;
}
