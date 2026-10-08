import SettingsPanel from "~/components/Settings/SettingsPanel";
import { googleEnabled } from "~/server/auth";
import { requireSession } from "~/server/guards";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Settings" };

export default async function Page() {
  const { session } = await requireSession();
  await api.user.getUser.prefetch();

  return (
    <HydrateClient>
      <SettingsPanel
        googleEnabled={googleEnabled}
        currentSessionId={session.id}
      />
    </HydrateClient>
  );
}
