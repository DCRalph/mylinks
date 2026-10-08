import { requireUser } from "~/server/guards";
import Dashboard from "./Dashboard";

export default async function Page() {
  await requireUser();
  return <Dashboard />;
}
