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
  getMyLinks: protectedProcedure.query(async ({ ctx }) => {
    const links = await db.link.findMany({
      where: { userId: ctx.session.user.id },
      include: { _count: { select: { clicks: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { links };
  }),

  /** Clicks across all of the user's links this week and the week before. */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = Date.now();
    const mine = { link: { userId: ctx.session.user.id } };

    const [thisWeek, lastWeek] = await Promise.all([
      db.click.count({
        where: { ...mine, createdAt: { gte: new Date(now - 7 * DAY_MS) } },
      }),
      db.click.count({
        where: {
          ...mine,
          createdAt: {
            gte: new Date(now - 14 * DAY_MS),
            lt: new Date(now - 7 * DAY_MS),
          },
        },
      }),
    ]);

    return { thisWeek, lastWeek };
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

  /** Most recent clicks on a link, newest first. */
  getClicks: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user);

      const clicks = await db.click.findMany({
        where: { linkId: input.id },
        select: { id: true, createdAt: true, userAgent: true, referer: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      });

      return { clicks };
    }),
});
