import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { usernameSchema } from "~/lib/validation";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";

// User management only. Admins edit anyone's links and profiles through the
// regular link/profile procedures, which allow admins (see access.ts).

const userCounts = {
  _count: { select: { Links: true, Profiles: true, SpyPixels: true } },
} as const;

async function toggleFlag(userID: string, flag: "admin" | "spyPixel") {
  const user = await db.user.findUnique({ where: { id: userID } });
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }
  return db.user.update({
    where: { id: userID },
    data: { [flag]: !user[flag] },
  });
}

export const adminRouter = createTRPCRouter({
  getUsers: adminProcedure.query(() =>
    db.user.findMany({
      include: { accounts: { select: { providerId: true } }, ...userCounts },
      orderBy: { createdAt: "desc" },
    }),
  ),

  getUser: adminProcedure
    .input(z.object({ userID: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.userID },
        include: {
          accounts: { select: { providerId: true } },
          Links: {
            include: { _count: { select: { clicks: true } } },
            orderBy: { createdAt: "desc" },
          },
          Profiles: {
            include: {
              _count: { select: { clicks: true, profileLinks: true } },
            },
          },
          ...userCounts,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  updateUsername: adminProcedure
    .input(z.object({ userID: z.string(), username: usernameSchema }))
    .mutation(async ({ input }) => {
      const taken = await db.user.findFirst({
        where: { username: input.username, NOT: { id: input.userID } },
      });
      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      return db.user.update({
        where: { id: input.userID },
        data: { username: input.username },
      });
    }),

  toggleAdminStatus: adminProcedure
    .input(z.object({ userID: z.string() }))
    .mutation(({ input, ctx }) => {
      if (input.userID === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't change your own admin status",
        });
      }
      return toggleFlag(input.userID, "admin");
    }),

  toggleSpyPixelStatus: adminProcedure
    .input(z.object({ userID: z.string() }))
    .mutation(({ input }) => toggleFlag(input.userID, "spyPixel")),
});
