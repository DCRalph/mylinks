import { expect, test } from "bun:test";

import { isInternalHost, requestHost } from "~/lib/domains";
import { domainHostSchema } from "~/lib/validation";

test("domains are normalized from whatever gets pasted", () => {
  expect(domainHostSchema.parse(" https://Go.Example.com/path?x=1 ")).toBe(
    "go.example.com",
  );
  expect(domainHostSchema.parse("short.localhost:3000")).toBe(
    "short.localhost:3000",
  );
});

test("IP addresses and junk aren't domains", () => {
  for (const host of ["203.0.113.4", "example", "-bad.com", "a b.com", ""]) {
    expect(domainHostSchema.safeParse(host).success).toBe(false);
  }
});

test("health checks on internal hosts always get through", () => {
  for (const host of [
    "localhost:3000",
    "127.0.0.1",
    "10.0.1.5:3000",
    "172.20.0.2",
    "192.168.1.9",
  ]) {
    expect(isInternalHost(host)).toBe(true);
  }
  for (const host of ["l2.it", "172.32.0.1", "8.8.8.8", "localhost.evil.com"]) {
    expect(isInternalHost(host)).toBe(false);
  }
});

test("the forwarded host wins, as better-auth sees it", () => {
  const headers = new Headers({
    host: "app:3000",
    "x-forwarded-host": "L2.it, proxy.internal",
  });
  expect(requestHost(headers)).toBe("l2.it");
  expect(requestHost(new Headers({ host: "Link2it.cc" }))).toBe("link2it.cc");
});
