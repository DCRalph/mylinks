import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { linkUrlSchema, slugSchema } from "~/lib/validation";
import { assertSlugLength, randomSlug } from "~/server/api/slugs";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

const linkInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  url: linkUrlSchema,
  // Empty means "generate one".
  slug: slugSchema,
});

async function assertSlugFree(slug: string, exceptId?: string) {
  const existing = await db.link.findUnique({ where: { slug } });
  if (existing && existing.id !== exceptId) {
    throw new TRPCError({ code: "CONFLICT", message: "Slug already exists" });
  }
}

async function findOwnLink(id: string, userId: string) {
  const link = await db.link.findUnique({ where: { id } });
  if (link?.userId !== userId) {
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

  createLink: protectedProcedure
    .input(linkInput)
    .mutation(async ({ input, ctx }) => {
      const slug = input.slug || randomSlug();
      assertSlugLength(slug, ctx.session.user.admin);
      await assertSlugFree(slug);

      const link = await db.link.create({
        data: {
          name: input.name,
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
      await findOwnLink(input.id, ctx.session.user.id);

      const slug = input.slug || randomSlug();
      assertSlugLength(slug, ctx.session.user.admin);
      await assertSlugFree(slug, input.id);

      const link = await db.link.update({
        where: { id: input.id },
        data: { name: input.name, url: input.url, slug },
      });

      return { link };
    }),

  deleteLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user.id);
      await db.link.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getClicks: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await findOwnLink(input.id, ctx.session.user.id);

      const clicks = await db.click.findMany({
        where: { linkId: input.id },
        select: { id: true, createdAt: true, userAgent: true, referer: true },
        orderBy: { createdAt: "desc" },
      });

      return { clicks };
    }),
});
