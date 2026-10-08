import { headers } from "next/headers";

import Brand from "~/components/Brand";
import { Button } from "~/components/ui/button";
import { requestHost } from "~/lib/domains";
import { getDomains } from "~/server/domains";

export const metadata = { title: "Not connected" };

/** 404 for hosts that point at this server but aren't an active domain. */
export default async function NotConnected() {
  const host = requestHost(await headers());
  const [primary] = (await getDomains()).active;

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col p-6 sm:p-10">
      <Brand href={primary.origin} />
      <div className="my-auto py-16">
        <p className="display text-lime text-[clamp(120px,26vw,320px)] leading-none">
          404
        </p>
        <h1 className="display mt-4 text-[clamp(48px,7vw,88px)] leading-[1.15]">
          Not connected.
        </h1>
        <p className="text-muted mt-4 max-w-lg text-lg">
          <span className="text-ink break-all">{host || "This domain"}</span>{" "}
          points here, but it isn’t set up as a link2it domain.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <a href={primary.origin}>Go to {primary.host}</a>
        </Button>
      </div>
    </main>
  );
}
