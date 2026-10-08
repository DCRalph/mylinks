import { expect, test } from "bun:test";

import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

const links = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("keeps the stored order and appends links missing from it", () => {
  expect(
    parseProfileLinkOrder({ linkOrderS: '["c","a"]', profileLinks: links }),
  ).toEqual(["c", "a", "b"]);
});

test("falls back to creation order when the stored value is corrupt", () => {
  expect(
    parseProfileLinkOrder({ linkOrderS: "not json", profileLinks: links }),
  ).toEqual(["a", "b", "c"]);
});

test("drops ids for links that no longer exist", () => {
  expect(
    parseProfileLinkOrder({ linkOrderS: '["gone","b"]', profileLinks: links }),
  ).toEqual(["b", "a", "c"]);
});
