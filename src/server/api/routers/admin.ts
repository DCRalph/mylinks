import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "~/generated/prisma/client";
import { growth } from "~/lib/format";
import { STAFF_ROLES } from "~/lib/permissions";
import { usernameSchema } from "~/lib/validation";
import { createTRPCRouter, permissionProcedure } from "~/server/api/trpc";
import { clickSeries, humanClicks } from "~/server/analytics";
import { audit, describeUser } from "~/server/audit";
import { db } from "~/server/db";

// The admin console's data. Changing roles, bans, sessions, impersonation and
// deleting users go through better-auth's admin endpoints from the client
// (authClient.admin.*); they check the same permissions and are audited by
// the hooks in src/server/auth.ts.

const DAY_MS = 24 * 60 * 60 * 1000;

const userFilter = z.enum(["all", "staff", "banned"]);

export const adminRouter = createTRPCRouter({
  /** Headline numbers, 30 days of clicks and this week's top links. */
  overview: permissionProcedure({ stats: ["read"] }).query(async () => {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * DAY_MS);
    const twoWeeksAgo = new Date(now - 14 * DAY_MS);

    const [[users], [links], [clicks], newest, topRows, chart] =
      await Promise.all([
        db.$queryRaw<[{ total: bigint; new: bigint }]>`
          SELECT count(*) AS total,
            count(*) FILTER (WHERE "createdAt" >= ${weekAgo}) AS new
          FROM "User"`,
        db.$queryRaw<[{ total: bigint; new: bigint }]>`
          SELECT count(*) AS total,
            count(*) FILTER (WHERE "createdAt" >= ${weekAgo}) AS new
          FROM "Link"`,
        // Short link clicks this week and last, bots this week, pixel loads this week.
        db.$queryRaw<
          [{ week: bigint; last: bigint; bots: bigint; pixels: bigint }]
        >`
          SELECT
            count(*) FILTER (WHERE "linkId" IS NOT NULL AND NOT "isBot" AND "createdAt" >= ${weekAgo}) AS week,
            count(*) FILTER (WHERE "linkId" IS NOT NULL AND NOT "isBot" AND "createdAt" < ${weekAgo}) AS last,
            count(*) FILTER (WHERE "linkId" IS NOT NULL AND "isBot" AND "createdAt" >= ${weekAgo}) AS bots,
            count(*) FILTER (WHERE "spyPixelId" IS NOT NULL AND NOT "isBot" AND "createdAt" >= ${weekAgo}) AS pixels
          FROM "Click" WHERE "createdAt" >= ${twoWeeksAgo}`,
        db.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, email: true, createdAt: true },
        }),
        db.click.groupBy({
          by: ["linkId"],
          where: {
            linkId: { not: null },
            isBot: false,
            createdAt: { gte: weekAgo },
          },
          _count: { _all: true },
          orderBy: { _count: { linkId: "desc" } },
          take: 5,
        }),
        clickSeries({ allLinks: true }, 30),
      ]);

    const topLinks = await db.link.findMany({
      where: { id: { in: topRows.flatMap((row) => row.linkId ?? []) } },
      include: { user: { select: { username: true, name: true } } },
    });
    const top = topRows.flatMap((row) => {
      const link = topLinks.find((l) => l.id === row.linkId);
      return link ? [{ ...link, weekClicks: row._count._all }] : [];
    });

    return {
      users: Number(users.total),
      newUsers: Number(users.new),
      links: Number(links.total),
      newLinks: Number(links.new),
      clicks: Number(clicks.week),
      clicksGrowth: growth(Number(clicks.week), Number(clicks.last)),
      bots: Number(clicks.bots),
      pixelLoads: Number(clicks.pixels),
      newest,
      top,
      days: chart.days,
    };
  }),

  /** Users matching a search, newest first. Capped so the page stays fast. */
  getUsers: permissionProcedure({ user: ["list"] })
    .input(
      z.object({
        search: z.string().trim().max(100).default(""),
        filter: userFilter.default("all"),
      }),
    )
    .query(({ input }) => {
      const where: Prisma.UserWhereInput = {
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { username: { contains: input.search, mode: "insensitive" } },
          ],
        }),
        ...(input.filter === "banned" && { banned: true }),
        ...(input.filter === "staff" && {
          AND: {
            OR: STAFF_ROLES.map((role) => ({ role: { contains: role } })),
          },
        }),
      };

      return db.user.findMany({
        where,
        include: {
          accounts: { select: { providerId: true } },
          _count: { select: { Links: true, Profiles: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
    }),

  getUser: permissionProcedure({ user: ["get"] })
    .input(z.object({ userID: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.userID },
        include: {
          accounts: { select: { providerId: true } },
          Links: {
            include: { _count: { select: humanClicks } },
            orderBy: { createdAt: "desc" },
          },
          Profiles: {
            include: {
              _count: {
                select: { ...humanClicks, profileLinks: true },
              },
            },
          },
          _count: { select: { SpyPixels: true, bookmarks: true } },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  updateUsername: permissionProcedure({ user: ["update"] })
    .input(z.object({ userID: z.string(), username: usernameSchema }))
    .mutation(async ({ input, ctx }) => {
      const taken = await db.user.findFirst({
        where: { username: input.username, NOT: { id: input.userID } },
      });
      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      const user = await db.user.update({
        where: { id: input.userID },
        data: { username: input.username },
      });

      await audit({
        actorId: ctx.session.user.id,
        action: "user.rename",
        target: { type: "user", id: user.id },
        summary: `Changed the username of ${await describeUser(user.id)} to @${user.username}`,
      });

      return user;
    }),

  /** The audit log, newest first, 50 at a time. */
  auditLog: permissionProcedure({ audit: ["read"] })
    .input(
      z.object({
        cursor: z.string().nullish(),
        search: z.string().trim().max(100).default(""),
      }),
    )
    .query(async ({ input }) => {
      const entries = await db.auditLog.findMany({
        where: input.search
          ? {
              OR: [
                { summary: { contains: input.search, mode: "insensitive" } },
                { action: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 51,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      return {
        entries: entries.slice(0, 50),
        nextCursor: entries.length > 50 ? entries[49]?.id : null,
      };
    }),
});
