import SettingsPanel from "~/components/Settings/SettingsPanel";
import { googleEnabled } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Settings" };

export default async function Page() {
  await api.user.getUser.prefetch();

  return (
    <HydrateClient>
      <SettingsPanel googleEnabled={googleEnabled} />
    </HydrateClient>
  );
}
