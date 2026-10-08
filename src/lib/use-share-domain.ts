"use client";

import { useSyncExternalStore } from "react";

import { useDomains } from "~/components/DomainsProvider";
import type { Domain } from "~/lib/domains";

const STORAGE_KEY = "link2it:share-domain";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// The picked domain, else the domain this page is on.
const getSnapshot = () =>
  localStorage.getItem(STORAGE_KEY) ?? window.location.host;

const getServerSnapshot = () => null;

/**
 * The domain shown in and copied from short link and profile URLs. Defaults to
 * the domain the dashboard is open on; a pick is remembered per browser.
 */
export function useShareDomain(): [Domain, (domain: Domain) => void] {
  const domains = useDomains();
  const host = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setShareDomain = (domain: Domain) => {
    localStorage.setItem(STORAGE_KEY, domain.host);
    listeners.forEach((listener) => listener());
  };

  return [domains.find((d) => d.host === host) ?? domains[0], setShareDomain];
}
