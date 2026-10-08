import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { slugSchema } from "~/lib/validation";
import { randomSlug } from "~/server/api/slugs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

/** Spy pixels are opt-in per user (or any admin). */
const spyPixelProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user.spyPixel && !ctx.session.user.admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to spy pixels",
    });
  }
  return next();
});

async function findOwnPixel(id: string, userId: string) {
  const pixel = await db.spyPixel.findUnique({ where: { id } });
  if (pixel?.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Spy pixel not found" });
  }
  return pixel;
}

export const spypixelRouter = createTRPCRouter({
  getAll: spyPixelProcedure.query(({ ctx }) =>
    db.spyPixel.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        _count: { select: { clicks: true } },
        clicks: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ),

  getClicks: spyPixelProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await findOwnPixel(input.id, ctx.session.user.id);
      return db.click.findMany({
        where: { spyPixelId: input.id },
        orderBy: { createdAt: "desc" },
      });
    }),

  createSpyPixel: spyPixelProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, "Name is required").max(50),
        // Empty means "generate one".
        slug: slugSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const slug = input.slug || randomSlug();

      const taken = await db.spyPixel.findUnique({ where: { slug } });
      if (taken) {
        throw new TRPCError({ code: "CONFLICT", message: "Slug already taken" });
      }

      return db.spyPixel.create({
        data: { name: input.name, slug, userId: ctx.session.user.id },
      });
    }),

  deleteSpyPixel: spyPixelProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await findOwnPixel(input.id, ctx.session.user.id);
      await db.spyPixel.delete({ where: { id: input.id } });
      return true;
    }),
});
