import { describe, expect, test } from "bun:test";

import {
  can,
  isStaff,
  parseRoles,
  STAFF_ROLES,
  type Permissions,
} from "./permissions";

describe("parseRoles", () => {
  test("defaults to user and drops roles that no longer exist", () => {
    expect(parseRoles(null)).toEqual(["user"]);
    expect(parseRoles("user, pixels,retired")).toEqual(["user", "pixels"]);
  });
});

describe("can", () => {
  test("combines every role a user holds", () => {
    expect(can({ role: "user" }, { pixel: ["use"] })).toBe(false);
    expect(can({ role: "user,pixels" }, { pixel: ["use"] })).toBe(true);
  });

  test("moderators ban but can't hand out roles", () => {
    const moderator = { role: "user,moderator" };
    expect(can(moderator, { user: ["ban"], link: ["moderate"] })).toBe(true);
    expect(can(moderator, { user: ["set-role"] })).toBe(false);
    expect(can(moderator, { domain: ["manage"] })).toBe(false);
  });

  test("needs every action unless any is set", () => {
    const pixels = { role: "pixels" };
    const both: Permissions = { pixel: ["use"], domain: ["manage"] };
    expect(can(pixels, both)).toBe(false);
    expect(can(pixels, both, { any: true })).toBe(true);
  });

  test("signed-out visitors can't do anything", () => {
    expect(can(null, { pixel: ["use"] })).toBe(false);
  });
});

test("staff are the roles that open the admin console", () => {
  expect(STAFF_ROLES).toEqual(["moderator", "admin"]);
  expect(isStaff({ role: "admin" })).toBe(true);
  expect(isStaff({ role: "user,moderator" })).toBe(true);
  expect(isStaff({ role: "user,pixels" })).toBe(false);
});
