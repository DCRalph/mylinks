import { type Profile, type ProfileLink } from "@prisma/client";
import ProfileLinkElement from "./ProfileLink";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function ProfilePage({
  profile,
}: {
  profile: Profile_ProjectLinks;
}) {
  const linkOrderS = profile.linkOrder as string | null;
  let linkOrder: string[] | null = null;

  if (linkOrderS === null) {
    linkOrder = profile.profileLinks.map((link) => link.id);
  } else {
    linkOrder = JSON.parse(linkOrderS) as string[];
  }

  const orderedLinks = linkOrder
    .map((id) => {
      return profile.profileLinks.find((link) => link.id === id);
    })
    .filter((link) => link !== undefined) as ProfileLink[];

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
        <h1 className="text-6xl text-white">{profile.name}</h1>
        <div className="flex select-none flex-col gap-4 pt-16">
          {orderedLinks.map((link) => {
            return <ProfileLinkElement key={link.id} link={link} />;
          })}
        </div>
      </div>
    </>
  );
}
