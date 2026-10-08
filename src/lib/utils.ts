import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Full page load. Used after signing in or out so server components and the
 * query cache start over with the new session.
 */
export function reloadTo(path: string) {
  window.location.assign(path);
}
