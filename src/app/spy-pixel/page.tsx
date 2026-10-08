import { notFound } from "next/navigation";

import { requireUser } from "~/server/guards";
import SpyPixelPage from "./spy-pixel";

export default async function Page() {
  const user = await requireUser();
  if (!user.spyPixel && !user.admin) notFound();
  return <SpyPixelPage />;
}
