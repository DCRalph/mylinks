import { z } from "zod";
import {db} from "~/server/db";

import {
  createTRPCRouter,
  protectedAdminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUsers: protectedAdminProcedure
  .query(() => {
    return db.user.findMany({
      include: {
        accounts: {
          select: {
            provider: true,
          }
        }
      }
    });
  }),
  getUsername: protectedProcedure
  .query(async ({ctx}) => {
    const user = await db.user.findUnique({
      where: {
        id: ctx.session?.user.id,
      },
    });

    return {
      username: user?.name,
    };
  }),
  setUsername: protectedProcedure
  .input(z.object({name: z.string()}))
  .mutation(async ({input, ctx}) => {
    const newName = input.name;

    const user = await db.user.update({
      where: {
        id: ctx.session?.user.id,
      },
      data: {
        name: newName
      },
    });

    await db.link.updateMany({
      where: {
        userId: ctx.session?.user.id,
        isUserLink: true,
      },
      data: {
        slug: newName,
      }
    });


    return {
      username: user.name,
    };
  }),
});
