import { z } from "zod";
import { db } from "~/server/db";

import badWords from "~/utils/badWords";


import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { randomUUID } from "crypto";

export const setupRouter = createTRPCRouter({
  createUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { username } = input;

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (username.length > 20) {
        throw new Error('Username must be at most 20 characters long');
      }

      const usernameExists = await db.user.findFirst({
        where: {
          username,
        },
      });

      if (usernameExists) {
        throw new Error('Username already exists');
      }

      const user = await db.user.update({
        where: {
          id: ctx.session?.user.id,
        },
        data: {
          username,
          requireSetup: false,
        },
      });

      return {
        user,
      };
    }),
});
