import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { slugSchema } from "~/lib/validation";
import { assertWithinLimit } from "~/server/api/limits";
import { randomSlug } from "~/server/api/slugs";
import { createTRPCRouter, permissionProcedure } from "~/server/api/trpc";
import { readStoredHeaders } from "~/server/clicks";
import { db } from "~/server/db";

/** Spy pixels are a role-granted feature (pixel:use). */
const spyPixelProcedure = permissionProcedure({ pixel: ["use"] });

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

  /** Every load of a pixel, newest first, with the request headers it arrived with. */
  getClicks: spyPixelProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await findOwnPixel(input.id, ctx.session.user.id);
      const clicks = await db.click.findMany({
        where: { spyPixelId: input.id },
        select: {
          id: true,
          createdAt: true,
          ipAddress: true,
          userAgent: true,
          referer: true,
          allHeaders: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return clicks.map(({ allHeaders, ...click }) => ({
        ...click,
        headers: readStoredHeaders(allHeaders),
      }));
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
      await assertWithinLimit("pixel", ctx.session.user);

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
