import { redirect } from "next/navigation";

import { getSession, googleEnabled } from "~/server/auth";
import SignIn from "./Signin";

export default async function Page() {
  if (await getSession()) redirect("/dashboard");
  return <SignIn googleEnabled={googleEnabled} />;
}
