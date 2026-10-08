import "server-only";

import { z } from "zod";

import { db } from "~/server/db";

/**
 * Admin-editable settings (Admin → Settings). Stored as JSON in the single
 * PlatformSettings row; every field has a default, so adding one needs no
 * migration.
 */
export const settingsSchema = z.object({
  /** Closed: only existing accounts can sign in. */
  signUps: z.enum(["open", "closed"]).default("open"),
  /** Slugs nobody can claim, on top of the app routes in src/utils/badWords.ts. */
  reservedSlugs: z.array(z.string()).default([]),
  /** Short links can't point at URLs containing any of these. */
  blockedUrls: z.array(z.string()).default(["porn", "lgbt"]),
  /** Days of clicks to keep. 0 keeps them forever. */
  clickRetentionDays: z
    .union([z.literal(0), z.literal(90), z.literal(365)])
    .default(0),
  /** full: keep. trim: drop the last part after 30 days. none: never store. */
  ipAddresses: z.enum(["full", "trim", "none"]).default("full"),
  /** Creation limits per account. Roles with platform:unlimited skip them. */
  limits: z
    .object({
      linksPerHour: z.number().int().min(1).max(10_000).default(60),
      profilesPerDay: z.number().int().min(1).max(1_000).default(10),
      pixelsPerDay: z.number().int().min(1).max(1_000).default(20),
    })
    .default({ linksPerHour: 60, profilesPerDay: 10, pixelsPerDay: 20 }),
});

export type PlatformSettings = z.infer<typeof settingsSchema>;

const TTL_MS = 30_000;

// On globalThis so every bundle in the server process sees one cache.
const cache = globalThis as unknown as {
  settings?: { value: PlatformSettings; loadedAt: number };
};

/** Parses stored settings, falling back to defaults for anything missing or invalid. */
function parse(data: unknown): PlatformSettings {
  const parsed = settingsSchema.safeParse(data ?? {});
  return parsed.success ? parsed.data : settingsSchema.parse({});
}

/** Current settings, cached for 30 seconds. */
export async function getSettings() {
  const current = cache.settings;
  if (current && Date.now() - current.loadedAt < TTL_MS) return current.value;
  const row = await db.platformSettings.findUnique({ where: { id: 1 } });
  const value = parse(row?.data);
  cache.settings = { value, loadedAt: Date.now() };
  return value;
}

/** Saves the whole settings object and returns it with defaults applied. */
export async function saveSettings(input: PlatformSettings) {
  const value = settingsSchema.parse(input);
  await db.platformSettings.upsert({
    where: { id: 1 },
    create: { id: 1, data: value },
    update: { data: value },
  });
  cache.settings = { value, loadedAt: Date.now() };
  return value;
}
