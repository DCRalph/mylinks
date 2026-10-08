import { notFound } from "next/navigation";

import { requireUser } from "~/server/guards";
import Admin from "./Admin";

export default async function Page() {
  const user = await requireUser();
  if (!user.admin) notFound();
  return <Admin />;
}
