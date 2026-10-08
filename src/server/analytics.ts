import "server-only";

import { Prisma } from "~/generated/prisma/client";
import { growth } from "~/lib/format";
import { db } from "~/server/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Which clicks to look at: one link, one profile, or every short link. */
export type ClickScope =
  { linkId: string } | { profileId: string } | { allLinks: true };

const scopeSql = (scope: ClickScope) =>
  "linkId" in scope
    ? Prisma.sql`"linkId" = ${scope.linkId}`
    : "profileId" in scope
      ? Prisma.sql`"profileId" = ${scope.profileId}`
      : Prisma.sql`"linkId" IS NOT NULL`;

const BREAKDOWNS = {
  sources: { column: "refererHost", empty: "Direct" },
  clients: { column: "client", empty: "Unknown" },
  devices: { column: "device", empty: "Unknown" },
  countries: { column: "country", empty: "Unknown" },
} as const;

/** "2026-10-08" for a date, in UTC. */
const utcDay = (date: Date) => date.toISOString().slice(0, 10);

/** Day boundaries (UTC) for the last `days` days and the period before. */
function period(days: number) {
  const today = new Date(`${utcDay(new Date())}T00:00:00.000Z`);
  const start = new Date(today.getTime() - (days - 1) * DAY_MS);
  return { start, previousStart: new Date(start.getTime() - days * DAY_MS) };
}

/**
 * People and bots per day over the last `days` days (UTC), and the change in
 * people against the period before. Bots never count toward the people numbers.
 */
export async function clickSeries(scope: ClickScope, days: number) {
  const where = scopeSql(scope);
  const { start, previousStart } = period(days);

  const [series, previous, allTime] = await Promise.all([
    db.$queryRaw<{ day: string; bot: boolean; count: bigint }[]>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
        "isBot" AS bot, count(*) AS count
      FROM "Click"
      WHERE ${where} AND "createdAt" >= ${start}
      GROUP BY 1, 2`,
    db.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count FROM "Click"
      WHERE ${where} AND NOT "isBot"
        AND "createdAt" >= ${previousStart} AND "createdAt" < ${start}`,
    db.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) AS count FROM "Click" WHERE ${where} AND NOT "isBot"`,
  ]);

  const byDay = new Map<string, { humans: number; bots: number }>();
  for (const row of series) {
    const entry = byDay.get(row.day) ?? { humans: 0, bots: 0 };
    entry[row.bot ? "bots" : "humans"] += Number(row.count);
    byDay.set(row.day, entry);
  }
  const daily = Array.from({ length: days }, (_, i) => {
    const date = utcDay(new Date(start.getTime() + i * DAY_MS));
    return { date, ...(byDay.get(date) ?? { humans: 0, bots: 0 }) };
  });

  const humans = daily.reduce((sum, day) => sum + day.humans, 0);
  const previousHumans = Number(previous[0]?.count ?? 0);

  return {
    days: daily,
    humans,
    bots: daily.reduce((sum, day) => sum + day.bots, 0),
    previousHumans,
    growth: growth(humans, previousHumans),
    allTimeHumans: Number(allTime[0]?.count ?? 0),
  };
}

/** Where people came from over the last `days` days: top 6 of each. */
export async function clickBreakdowns(scope: ClickScope, days: number) {
  const where = scopeSql(scope);
  const { start } = period(days);

  const breakdown = async ({
    column,
    empty,
  }: (typeof BREAKDOWNS)[keyof typeof BREAKDOWNS]) => {
    const rows = await db.$queryRaw<{ label: string | null; count: bigint }[]>`
      SELECT ${Prisma.raw(`"${column}"`)} AS label, count(*) AS count
      FROM "Click"
      WHERE ${where} AND NOT "isBot" AND "createdAt" >= ${start}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 6`;
    return rows.map((row) => ({
      label: row.label ?? empty,
      count: Number(row.count),
    }));
  };

  const [sources, clients, devices, countries] = await Promise.all([
    breakdown(BREAKDOWNS.sources),
    breakdown(BREAKDOWNS.clients),
    breakdown(BREAKDOWNS.devices),
    breakdown(BREAKDOWNS.countries),
  ]);
  return { sources, clients, devices, countries };
}

/** Series and breakdowns together, for the link and profile analytics panels. */
export async function clickAnalytics(scope: ClickScope, days: number) {
  const [series, breakdowns] = await Promise.all([
    clickSeries(scope, days),
    clickBreakdowns(scope, days),
  ]);
  return { ...series, ...breakdowns };
}

export type ClickAnalytics = Awaited<ReturnType<typeof clickAnalytics>>;

/** Prisma `_count` select that counts people only. Pair with botCounts. */
export const humanClicks = { clicks: { where: { isBot: false } } } as const;

/** Bot clicks per link, profile or pixel id. Ids without bots are absent. */
export async function botCounts(
  owner: "linkId" | "profileId" | "spyPixelId",
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, number>();
  const rows = await db.$queryRaw<{ id: string; count: bigint }[]>`
    SELECT ${Prisma.raw(`"${owner}"`)} AS id, count(*) AS count
    FROM "Click"
    WHERE ${Prisma.raw(`"${owner}"`)} IN (${Prisma.join(ids)}) AND "isBot"
    GROUP BY 1`;
  return new Map(rows.map((row) => [row.id, Number(row.count)]));
}

/** Adds `bots` to each item, from botCounts. */
export async function withBots<T extends { id: string }>(
  owner: "linkId" | "profileId" | "spyPixelId",
  items: T[],
) {
  const bots = await botCounts(
    owner,
    items.map((item) => item.id),
  );
  return items.map((item) => ({ ...item, bots: bots.get(item.id) ?? 0 }));
}
