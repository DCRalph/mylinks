import Link from "next/link";

import Brand from "~/components/Brand";
import { Button } from "~/components/ui/button";

/** What visitors see for a link or profile a moderator turned off. */
export default function TurnedOff({ what }: { what: "link" | "profile" }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col p-6 sm:p-10">
      <Brand />
      <div className="my-auto py-16">
        <p className="display text-lime text-[clamp(120px,26vw,320px)] leading-none">
          Off.
        </p>
        <h1 className="display mt-4 text-[clamp(48px,7vw,88px)] leading-[1.15]">
          This {what} was turned off.
        </h1>
        <p className="text-muted mt-4 max-w-lg text-lg">
          A moderator turned it off, so it no longer goes anywhere.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
