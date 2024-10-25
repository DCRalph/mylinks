// import { z } from "zod";
import { db } from "~/server/db";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const spypixelRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user.spyPixel) {
      throw new Error("User does not have access to spy pixel");
    }

    const spypixels = await db.spyPixel.findMany({
      where: {
        userId: ctx.session?.user.id,
      },
    });

    return spypixels;
  }),
});
