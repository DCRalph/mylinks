import { describe, expect, test } from "bun:test";

import { formatRelative, growth, hostOf, plural, slugify } from "~/lib/format";

test("slugify makes a valid profile slug from a name", () => {
  expect(slugify("William Giles")).toBe("william_giles");
  expect(slugify("  Ōtautahi Café!! ")).toBe("otautahi_cafe");
  expect(slugify("a".repeat(30))).toHaveLength(20);
});

test("growth handles a zero baseline", () => {
  expect(growth(10, 0)).toBe(100);
  expect(growth(0, 0)).toBe(0);
  expect(growth(15, 10)).toBe(50);
  expect(growth(5, 10)).toBe(-50);
});

describe("formatRelative", () => {
  const now = Date.UTC(2026, 9, 8, 12);
  test("rounds to the largest unit", () => {
    expect(formatRelative(new Date(now - 30_000), now)).toBe("just now");
    expect(formatRelative(new Date(now - 3 * 3600_000), now)).toBe("3 hours ago");
    expect(formatRelative(new Date(now - 26 * 3600_000), now)).toBe("yesterday");
  });
});

test("hostOf strips www and survives non-URLs", () => {
  expect(hostOf("https://www.google.com/search?q=x")).toBe("google.com");
  expect(hostOf("unknown")).toBe("unknown");
});

test("plural", () => {
  expect(plural(1, "link")).toBe("1 link");
  expect(plural(1284, "click")).toBe("1,284 clicks");
});
