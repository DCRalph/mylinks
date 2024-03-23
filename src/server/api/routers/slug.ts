import { z } from "zod";
import {db} from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const slugRouter = createTRPCRouter({
  getLongUrl: publicProcedure
  .input(z.object({slug: z.string()}))
  .query(async ({input}) => {
    const {slug} = input;
    const url = await db.link.findUnique({
      where: {
        slug,
      },
    });

    if (!url) {
      return {
        error: "Link not found",
      };
    }


    return {
      url: url.url,
    };

  }),
  getMyUrls: protectedProcedure
  .query(async ({ctx}) => {
    const urls = await db.link.findMany({
      where: {
        userId: ctx.session?.user.id,
      },
    });

    return {
      urls,
    };
  }),
});
