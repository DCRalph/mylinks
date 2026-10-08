"use client";

import Brand from "~/components/Brand";
import { Button } from "~/components/ui/button";

/** Last-resort error screen for anything that throws while rendering. */
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col p-6 sm:p-10">
      <Brand />
      <div className="my-auto py-16">
        <h1 className="display text-[clamp(72px,12vw,160px)] leading-[1.15]">
          Something <span className="text-danger">broke.</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted">
          That’s on us. Try again, and if it keeps happening, come back in a
          bit.
        </p>
        <Button size="lg" className="mt-8" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
