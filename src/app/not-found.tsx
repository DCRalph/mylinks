import Link from "next/link";

import Brand from "~/components/Brand";
import NotFoundPath from "~/components/NotFoundPath";
import { Button } from "~/components/ui/button";

export const metadata = { title: "Not found" };

/** 404 for unknown short links, profiles and pages. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col p-6 sm:p-10">
      <Brand />
      <div className="my-auto py-16">
        <p className="display text-[clamp(120px,26vw,320px)] leading-none text-lime">
          404
        </p>
        <h1 className="display mt-4 text-[clamp(48px,7vw,88px)] leading-[1.15]">
          Nothing lives here.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted">
          There’s no link or page at <NotFoundPath />. It may have been
          renamed or deleted.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
