import { type Profile, type ProfileLink } from "@prisma/client";
import ProfileLinkElement from "./ProfileLink";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function ProfilePage({
  profile,
}: {
  profile: Profile_ProjectLinks;
}) {
  const linkOrder = parseProfileLinkOrder({
    linkOrderS: profile.linkOrder,
    profileLinks: profile.profileLinks,
  });

  const orderedLinks = linkOrder
    .map((id) => {
      return profile.profileLinks.find((link) => link.id === id);
    })
    .filter((link) => link !== undefined) as ProfileLink[];

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-8">
        <h1 className="text-6xl text-white">{profile.name}</h1>

        {profile.bio != null && (
          <div className="pt-8">
            {/* <p className="text-xl text-zinc-400 ">Bio:</p> */}
            <p className="max-w-2xl text-lg text-white">{profile.bio}</p>
          </div>
        )}
        {profile.profileLinks.length != 0 && (
          <div className="flex select-none flex-col gap-4 pt-16">
            {orderedLinks.map((link) => {
              return <ProfileLinkElement key={link.id} link={link} />;
            })}
          </div>
        )}
      </div>
    </>
  );
}
