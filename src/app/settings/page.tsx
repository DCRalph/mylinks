import { googleEnabled } from "~/server/auth";
import { requireUser } from "~/server/guards";
import Settings from "./Settings";

export default async function Page() {
  await requireUser();
  return <Settings googleEnabled={googleEnabled} />;
}
