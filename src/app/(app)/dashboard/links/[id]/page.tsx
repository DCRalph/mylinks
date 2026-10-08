import LinkStats from "~/components/Links/LinkStats";
import { api, HydrateClient } from "~/trpc/server";

export const metadata = { title: "Link stats" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Unknown or someone else's link: the client shows "Link not found".
  await Promise.all([
    api.link.getLink.prefetch({ id }),
    api.link.getAnalytics.prefetch({ id, days: 7 }),
    api.link.getClicks.prefetchInfinite({ id }),
  ]);

  return (
    <HydrateClient>
      <LinkStats id={id} />
    </HydrateClient>
  );
}
