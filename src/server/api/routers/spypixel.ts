import { z } from "zod";
import { db } from "~/server/db";
import { randomUUID } from "crypto";

import badWords from "~/utils/badWords";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";


const getAll = protectedProcedure.query(async ({ ctx }) => {
  if (!ctx.session?.user.spyPixel) {
    throw new Error("User does not have access to spy pixel");
  }

  const spypixels = await db.spyPixel.findMany({
    where: {
      userId: ctx.session?.user.id,
    },
  });

  return spypixels;
});

const get = protectedProcedure.input(z.object({
  id: z.string(),
})).query(async ({ input, ctx }) => {
  if (!ctx.session?.user.spyPixel) {
    throw new Error("User does not have access to spy pixel");
  }

  const spypixel = await db.spyPixel.findUnique({
    where: {
      id: input.id,
      userId: ctx.session?.user.id,
    }
  });

  return spypixel;
});

const getClicks = protectedProcedure.input(z.object({
  id: z.string(),
})).query(async ({ input, ctx }) => {
  if (!ctx.session?.user.spyPixel) {
    throw new Error("User does not have access to spy pixel");
  }

  const spyPixel = await db.spyPixel.findUnique({
    where: {
      id: input.id,
      userId: ctx.session?.user.id,
    },
  });

  if (!spyPixel) {
    throw new Error("Spy pixel not found");
  }

  const clicks = await db.click.findMany({
    where: {
      spyPixelId: input.id,
    },
  });

  return clicks;
});


const createSpyPixel = protectedProcedure.input(z.object({
  name: z.string(),
  slug: z.string().optional(),
})).mutation(async ({ input, ctx }) => {
  if (!ctx.session?.user.spyPixel) {
    throw new Error("User does not have access to spy pixel");
  }

  if (!input.name || input.name.length === 0) {
    throw new Error("Name is required");
  }


  let slug = input.slug;

  if (!slug || slug.length === 0) {
    slug = randomUUID().slice(0, 8);
  }

  // todo: check if slug is already taken

  const existingSlug = await db.spyPixel.findUnique({
    where: {
      slug,
    },
  });

  if (existingSlug) {
    throw new Error("Slug already taken");
  }



  // todo: check if slug is a bad word

  for (const badSlug of badWords.badSlugs) {
    if (slug.includes(badSlug)) {
      throw new Error("Slug contains bad word");
    }
  }



  const spyPixel = await db.spyPixel.create({
    data: {
      name: input.name,
      slug,
      userId: ctx.session?.user.id,
    },
  });

  return spyPixel;
});

const deleteSpyPixel = protectedProcedure.input(z.object({
  id: z.string(),
})).mutation(async ({ input, ctx }) => {
  if (!ctx.session?.user.spyPixel) {
    throw new Error("User does not have access to spy pixel");
  }

  const spyPixel = await db.spyPixel.findUnique({
    where: {
      id: input.id,
      userId: ctx.session?.user.id,
    },
  });

  if (!spyPixel) {
    throw new Error("Spy pixel not found");
  }

  await db.spyPixel.delete({
    where: {
      id: input.id,
    },
  });

  return true;
});

export const spypixelRouter = createTRPCRouter({
  getAll,
  get,
  getClicks,
  createSpyPixel,
  deleteSpyPixel,
});
