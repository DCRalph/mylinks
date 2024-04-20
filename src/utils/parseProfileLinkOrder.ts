import { string, array } from "zod";

const schema = array(string());

export default function parseProfileLinkOrder(order: string | undefined): string[] {

  if (!order) {
    return [];
  }

  return schema.parse(JSON.parse(order));
}
