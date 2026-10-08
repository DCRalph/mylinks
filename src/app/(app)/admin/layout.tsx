import { notFound } from "next/navigation";

import AdminTabs from "~/components/Admin/AdminTabs";
import { isStaff } from "~/lib/permissions";
import { requireUser } from "~/server/guards";

/** The admin console frame: heading and tabs. Each page checks its own permission. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!isStaff(user)) notFound();

  return (
    <>
      <h1 className="display text-[60px] leading-[1.15] sm:text-[96px]">
        Admin
      </h1>
      <AdminTabs role={user.role} />
      {children}
    </>
  );
}
