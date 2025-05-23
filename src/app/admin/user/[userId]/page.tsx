// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth"; // Adjust the import to your authOptions
import { checkRequireSetup } from "~/utils/requireSetup";
import AdminUser from "./AdminUser";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // User is not authenticated, redirect to home page
    redirect("/");
  }

  const needsSetup = await checkRequireSetup();

  if (needsSetup) {
    // User needs to complete setup, redirect to setup page
    redirect("/");
  }

  const isAdmin = session.user.admin;

  if (!isAdmin) {
    // User is not an admin, redirect to home page
    redirect("/");
  }

  return <AdminUser params={params} />;
}
