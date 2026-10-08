import ProfilesList from "~/components/Profiles/ProfilesList";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Profiles" };

export default async function Page() {
  await api.profile.getProfiles.prefetch();

  return (
    <HydrateClient>
      <ProfilesList />
    </HydrateClient>
  );
}
