/** Icons a profile button can show, from public/profileLinkIcons. */
export const profileLinkIcons = [
  { name: "Generic", file: "generic.png" },
  { name: "GitHub", file: "github.png" },
  { name: "Instagram", file: "instagram.png" },
  { name: "LinkedIn", file: "linkedin.png" },
  { name: "Twitter", file: "twitter.svg" },
  { name: "X", file: "x(twitter).png" },
  { name: "YouTube", file: "youtube.png" },
  { name: "Snapchat", file: "snapchat.png" },
  { name: "Discord", file: "discord.png" },
  { name: "Facebook", file: "facebook.svg" },
] as const;

export type ProfileLinkIcon = (typeof profileLinkIcons)[number]["file"];

export const iconSrc = (file: string) =>
  `/profileLinkIcons/${encodeURIComponent(file)}`;

export const isProfileLinkIcon = (file: string): file is ProfileLinkIcon =>
  profileLinkIcons.some((icon) => icon.file === file);
