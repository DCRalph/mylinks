import { describe, expect, test } from "bun:test";

import {
  linkUrlSchema,
  profileLinkUrlSchema,
  slugSchema,
  usernameSchema,
} from "~/lib/validation";

describe("profileLinkUrlSchema", () => {
  test("allows web, mail and phone links", () => {
    for (const url of ["https://x.com/me", "mailto:a@b.co", "tel:+6421000"]) {
      expect(profileLinkUrlSchema.safeParse(url).success).toBe(true);
    }
  });

  test("rejects script and data URLs on public profiles", () => {
    for (const url of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x"]) {
      expect(profileLinkUrlSchema.safeParse(url).success).toBe(false);
    }
  });
});

test("short links only point at http(s)", () => {
  expect(linkUrlSchema.safeParse("https://example.com").success).toBe(true);
  expect(linkUrlSchema.safeParse("example.com").success).toBe(false);
  expect(linkUrlSchema.safeParse("ftp://example.com").success).toBe(false);
});

test("slugs can't shadow app routes, whatever the case", () => {
  expect(slugSchema.safeParse("Dashboard").success).toBe(false);
  expect(slugSchema.safeParse("dash").success).toBe(true);
  expect(slugSchema.safeParse("").success).toBe(true);
  expect(slugSchema.safeParse("a/b").success).toBe(false);
});

test("usernames are 3-20 word characters and not reserved", () => {
  expect(usernameSchema.safeParse("alice_1").success).toBe(true);
  expect(usernameSchema.safeParse("al").success).toBe(false);
  expect(usernameSchema.safeParse("Admin").success).toBe(false);
});
