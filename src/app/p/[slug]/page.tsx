import React, { use } from "react";
import { api } from "~/trpc/server";
import { getServerAuthSession } from "~/server/auth";
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
  // const session = use(getServerAuthSession());

  const profile = use(getProfile(slug));

  if (!profile) {
    return <ProfileNotFound slug={slug} />;
  }

  // const isOwner = session?.user?.id === profile.userId;

  return <ProfilePage profile={profile} />;
}
