import React, { use } from "react";
import { api } from "~/trpc/server";
import ProfilePage from "~/components/ProfilePage/ProfilePage";
import ProfileNotFound from "~/components/ProfilePage/ProfileNotFound";

const getProfile = async (slug: string) => {
  const profile = await api.profile.getPublicProfile({ slug });
  return profile;
};

export default function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const profile = use(getProfile(slug));

  if (!profile) {
    return <ProfileNotFound slug={slug} />;
  }

  return <ProfilePage profile={profile} />;
}
