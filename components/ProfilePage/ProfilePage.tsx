import { type Profile, type ProfileLink } from "@prisma/client"
import ProfileLinkElement from "./ProfileLink";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function ProfilePage({ profile }: { profile: Profile_ProjectLinks }) {

  const orderedLinks = profile.profileLinks.sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">

        <h1 className="text-6xl text-white">{profile.name}</h1>
        <div className="gap-4 pt-16 select-none flex flex-col">

          {orderedLinks.map((link) => {
            return <ProfileLinkElement key={link.id} link={link} />
          })}

        </div>
      </div>
    </>
  )



}