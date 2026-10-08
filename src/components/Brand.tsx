import Link from "next/link";

import { cn } from "~/lib/utils";

/** The "LINK2IT" wordmark with the lime 2. */
export default function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("display text-[30px] text-ink", className)}>
      Link<span className="text-lime">2</span>it
    </Link>
  );
}
