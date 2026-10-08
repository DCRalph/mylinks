import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { linkUrlSchema, slugSchema } from "~/lib/validation";
import { canManage } from "~/server/api/access";
import { assertWithinLimit } from "~/server/api/limits";
import {
  assertSlugAllowed,
  assertUrlAllowed,
  randomSlug,
} from "~/server/api/slugs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  botCounts,
  clickAnalytics,
  humanClicks,
  withBots,
} from "~/server/analytics";
import { db } from "~/server/db";
import { findLinkSlugClash } from "~/server/slugs";

const DAY_MS = 24 * 60 * 60 * 1000;

const linkInput = z.object({
  // Empty means "use the destination's hostname".
  name: z.string().trim().max(50),
  url: linkUrlSchema,
  // Empty means "generate one".
  slug: slugSchema,
});

async function assertSlugFree(slug: string, exceptId?: string) {
  if (await findLinkSlugClash(slug, exceptId)) {
    throw new TRPCError({ code: "CONFLICT", message: "Slug already exists" });
  }
}

async function findOwnLink(
  id: string,
  user: { id: string; role?: string | null },
) {
  const link = await db.link.findUnique({ where: { id } });
  if (!link || !canManage("link", link.userId, user)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Link not found" });
  }
  return link;
}

export const linkRouter = createTRPCRouter({
  /** The user's links. `_count.clicks` counts people; `bots` the rest. */
  getMyLinks: protectedProcedure.query(async ({ ctx }) => {
    const links = await db.link.findMany({
      where: { userId: ctx.session.user.id },
      include: { _count: { select: humanClicks } },
      orderBy: { createdAt: "desc" },
    });

    return { links: await withBots("linkId", links) };
  }),

  /** People across all of the user's links this week and the week before, plus this week's bots. */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = Date.now();
    const mine = { link: { userId: ctx.session.user.id } };
    const thisWeekOnly = { gte: new Date(now - 7 * DAY_MS) };

    const [thisWeek, lastWeek, botsThisWeek] = await Promise.all([
      db.click.count({
        where: { ...mine, isBot: false, createdAt: thisWeekOnly },
      }),
      db.click.count({
        where: {
          ...mine,
          isBot: false,
          createdAt: {
            gte: new Date(now - 14 * DAY_MS),
            lt: new Date(now - 7 * DAY_MS),
          },
        },
      }),
      db.click.count({
        where: { ...mine, isBot: true, createdAt: thisWeekOnly },
      }),
    ]);

    return { thisWeek, lastWeek, botsThisWeek };
  }),

  /** One link with its counts, for the stats page. */
  getLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user);
      const link = await db.link.findUniqueOrThrow({
        where: { id: input.id },
        include: { _count: { select: humanClicks } },
      });
      const bots = await botCounts("linkId", [link.id]);
      return { ...link, bots: bots.get(link.id) ?? 0 };
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ id: z.string(), days: z.number().int().min(1).max(90) }))
    .query(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user);
      return clickAnalytics({ linkId: input.id }, input.days);
    }),

  createLink: protectedProcedure
    .input(linkInput)
    .mutation(async ({ input, ctx }) => {
      const slug = input.slug || randomSlug();
      await assertSlugAllowed(slug, ctx.session.user);
      await assertUrlAllowed(input.url);
      await assertSlugFree(slug);
      await assertWithinLimit("link", ctx.session.user);

      const link = await db.link.create({
        data: {
          name: input.name || new URL(input.url).hostname,
          url: input.url,
          slug,
          userId: ctx.session.user.id,
        },
      });

      return { link };
    }),

  editLink: protectedProcedure
    .input(linkInput.extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user);

      const slug = input.slug || randomSlug();
      await assertSlugAllowed(slug, ctx.session.user);
      await assertUrlAllowed(input.url);
      await assertSlugFree(slug, input.id);

      const link = await db.link.update({
        where: { id: input.id },
        data: {
          name: input.name || new URL(input.url).hostname,
          url: input.url,
          slug,
        },
      });

      return { link };
    }),

  deleteLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user);
      await db.link.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /** A link's clicks, newest first, 50 at a time. IP addresses stay private. */
  getClicks: protectedProcedure
    .input(z.object({ id: z.string(), cursor: z.string().nullish() }))
    .query(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user);

      const clicks = await db.click.findMany({
        where: { linkId: input.id },
        select: {
          id: true,
          createdAt: true,
          isBot: true,
          client: true,
          os: true,
          device: true,
          country: true,
          referer: true,
          refererHost: true,
          host: true,
          userAgent: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 51,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      return {
        clicks: clicks.slice(0, 50),
        nextCursor: clicks.length > 50 ? clicks[49]?.id : null,
      };
    }),
});
