import { z } from "zod";
import { db } from "~/server/db";

import badWords from "~/utils/badWords";


import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

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


  editProfileLink: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string(), url: z.string(), showenUrl: z.string(), bgColor: z.string(), fgColor: z.string(), iconUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id, title, url, showenUrl, bgColor, fgColor, iconUrl } = input;

      const profileLink = await db.profileLink.findUnique({
        where: {
          id,
        },
        include: {
          profile: true,
        },
      });

      if (!profileLink) {
        throw new Error('Link not found');
      }

      if (profileLink.profile.userId !== ctx.session?.user.id) {
        throw new Error('Not authorized');
      }

      await db.profileLink.update({
        where: {
          id,
        },
        data: {
          title,
          url,
          showenUrl,
          bgColor,
          fgColor,
          iconUrl,
        },
      });

      return {
        success: true,
      };
    }),
});
