import { redirect } from "next/navigation";

import { getSession } from "~/server/auth";
import Setup from "./Setup";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (!session.user.requireSetup) redirect("/dashboard");
  return <Setup />;
}
