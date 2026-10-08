import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { usernameSchema } from "~/lib/validation";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const setupRouter = createTRPCRouter({
  /** First-run step after Google sign-up: pick a username and leave setup. */
  createUsername: protectedProcedure
    .input(z.object({ username: usernameSchema }))
    .mutation(async ({ input, ctx }) => {
      const taken = await db.user.findFirst({
        where: { username: input.username, NOT: { id: ctx.session.user.id } },
      });

      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const user = await db.user.update({
        where: { id: ctx.session.user.id },
        data: { username: input.username, requireSetup: false },
      });

      return { user };
    }),
});
