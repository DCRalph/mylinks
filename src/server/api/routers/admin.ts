import { z } from "zod";
import { db } from "~/server/db";

import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";

export const adminRouter = createTRPCRouter({
  getUser: adminProcedure
    .input(z.object({ userID: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: {
          id: input.userID,
        },
        include: {
          accounts: {
            select: {
              provider: true,
            },
          },
          Links: true,
          Profiles: {
            include: {
              profileLinks: true,
            },
          },
        },
      });

      return {
        user,
      };
    }),

  getUsers: adminProcedure.query(async () => {
    const data = await db.user.findMany({
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
        Links: true,
        Profiles: true,
      },
    });

    return data;
  }),
});
