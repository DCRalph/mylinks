import { z } from "zod";
import {db} from "~/server/db";

import {
  createTRPCRouter,
  protectedAdminProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getUsers: protectedAdminProcedure.query(() => {
    return db.user.findMany({
      include: {
        accounts: {
          select: {
            provider: true,
          }
        }
      }
    });
  })
});
