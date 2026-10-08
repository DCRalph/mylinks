import LinksDashboard from "~/components/Links/LinksDashboard";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Links" };

export default async function Page() {
  await Promise.all([
    api.link.getMyLinks.prefetch(),
    api.link.getStats.prefetch(),
    api.profile.getProfiles.prefetch(),
  ]);

  return (
    <HydrateClient>
      <LinksDashboard />
    </HydrateClient>
  );
}
