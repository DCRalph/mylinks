import { z } from "zod";
import { db } from "~/server/db";

import badWords from "~/utils/badWords";


import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { randomUUID } from "crypto";

export const profileRouter = createTRPCRouter({
  getProfiles: protectedProcedure
    .query(async ({ ctx }) => {

      const profiles = await db.profile.findMany({
        where: {
          userId: ctx.session?.user.id,
        },
        include: {
          profileLinks: true,
        },
      });

      return {
        profiles
      }
    }),
  createProfileLink: protectedProcedure
    .input(z.object({ name: z.string(), url: z.string(), slug: z.string() }))
    .mutation(async ({ input, ctx }) => {

      return {
        ok: true
      }

    }),
});
