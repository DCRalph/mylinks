import { NextResponse, type NextRequest } from "next/server";

import { isInternalHost, requestHost } from "~/lib/domains";
import { hostStatus } from "~/server/domains";

/**
 * Serves the app only on active domains (Admin → Domains). Pending domains
 * answer the verify check, and every other host gets the "not connected" 404.
 */
export async function proxy(request: NextRequest) {
  const host = requestHost(request.headers);
  if (isInternalHost(host)) return NextResponse.next();

  const status = await hostStatus(host);
  if (status === "active") return NextResponse.next();
  if (
    status === "pending" &&
    request.nextUrl.pathname === "/api/domains/verify"
  ) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(new URL("/unknown-host", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
