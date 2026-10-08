"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const noSubscribe = () => () => undefined;

/** The address that 404'd, e.g. "l2.it/nope". The host fills in after hydration. */
export default function NotFoundPath() {
  const pathname = usePathname();
  const host = useSyncExternalStore(
    noSubscribe,
    () => window.location.host,
    () => "",
  );
  return (
    <span className="break-all text-ink">
      {host}
      {pathname}
    </span>
  );
}
