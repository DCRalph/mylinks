import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import badWords from "~/utils/badWords";

export const userRouter = createTRPCRouter({
  getUser: publicProcedure.query(async ({ ctx }) => {

    if (!ctx.session?.user.id) {
      return {
        user: null,
      };
    }

    const user = await db.user.findUnique({
      where: {
        id: ctx.session?.user.id,
      },
    });

    return {
      user,
    };
  }),
  setUsername: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const newUsername = input.name;

      if (newUsername.length < 3) {
        throw new Error("Username must be at least 3 characters long");
      }

      if (newUsername.length > 20) {
        throw new Error("Username must be at most 20 characters long");
      }

      if (!/^[a-zA-Z0-9_]*$/.test(newUsername)) {
        throw new Error(
          "Username can only contain letters, numbers and underscores",
        );
      }

      const lowerUsername = newUsername.toLowerCase();
      const indexInBadUsernames = badWords.badUsernames.indexOf(lowerUsername);
      if (indexInBadUsernames !== -1) {
        throw new Error(
          `Username cannot be "${badWords.badUsernames[indexInBadUsernames]}"`,
        );
      }

      if (newUsername == ctx.session?.user.username) {
        throw new Error("Username cannot be the same as the current one");
      }

      const usernameExists = await db.user.findUnique({
        where: {
          username: newUsername,
        },
      });

      if (usernameExists) {
        throw new Error("Username already exists");
      }

      const user = await db.user.update({
        where: {
          id: ctx.session?.user.id,
        },
        data: {
          username: newUsername,
        },
      });

      return {
        username: user.name,
      };
    }),
});
