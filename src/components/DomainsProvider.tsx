"use client";

import { createContext, use } from "react";

import type { Domain } from "~/lib/domains";

const DomainsContext = createContext<[Domain, ...Domain[]] | null>(null);

/** Hands the active domains (Admin → Domains) to client components. Set in the root layout. */
export function DomainsProvider({
  domains,
  children,
}: {
  domains: [Domain, ...Domain[]];
  children: React.ReactNode;
}) {
  return <DomainsContext value={domains}>{children}</DomainsContext>;
}

/** Active domains, primary first. */
export function useDomains() {
  const domains = use(DomainsContext);
  if (!domains) throw new Error("useDomains needs a DomainsProvider");
  return domains;
}
