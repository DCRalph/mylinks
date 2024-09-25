import { string, array } from "zod";
import { type ProfileLink } from "@prisma/client";

const schema = array(string());

type Prams = {
  linkOrderS: string;
  profileLinks: ProfileLink[];
};

export default function parseProfileLinkOrder({
  linkOrderS,
  profileLinks,
}: Prams): string[] {
  let linkOrder: string[];

  if (linkOrderS === null) {
    linkOrder = profileLinks.map((link) => link.id);
  } else {
    linkOrder = schema.parse(JSON.parse(linkOrderS));
  }

  return linkOrder;
}
