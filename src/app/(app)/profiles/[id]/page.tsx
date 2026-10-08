import ProfileEditor from "~/components/Profiles/ProfileEditor";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Edit profile" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await api.profile.getProfile.prefetch({ id });

  return (
    <HydrateClient>
      <ProfileEditor id={id} />
    </HydrateClient>
  );
}
