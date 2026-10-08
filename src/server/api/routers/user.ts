import { TRPCError } from "@trpc/server";
import { APIError } from "better-auth/api";
import { z } from "zod";

import { passwordSchema, usernameSchema } from "~/lib/validation";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { getAuth } from "~/server/auth";
import { db } from "~/server/db";

/** Turns better-auth API errors into tRPC errors the client can show. */
async function callAuth<T>(call: () => Promise<T>) {
  try {
    return await call();
  } catch (error) {
    if (error instanceof APIError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }
    throw error;
  }
}

export const userRouter = createTRPCRouter({
  /** The signed-in user (or null) with the providers they can sign in with. */
  getUser: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      return { user: null };
    }

    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        accounts: { select: { id: true, providerId: true, createdAt: true } },
      },
    });

    return { user };
  }),

  exportUserData: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        accounts: { select: { providerId: true, createdAt: true } },
        Links: true,
        Profiles: { include: { profileLinks: true } },
        bookmarks: { include: { tags: true } },
        bookmarkFolder: true,
        SpyPixels: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accounts: user.accounts,
      links: user.Links,
      profiles: user.Profiles,
      bookmarks: user.bookmarks,
      bookmarkFolders: user.bookmarkFolder,
      spyPixels: user.SpyPixels.length > 0 ? user.SpyPixels : undefined,
    };
  }),

  /** Adds email + password sign-in to an account that only has Google. */
  createPassword: protectedProcedure
    .input(z.object({ password: passwordSchema }))
    .mutation(({ input, ctx }) =>
      callAuth(async () =>
        (await getAuth()).api.setPassword({
          body: { newPassword: input.password },
          headers: ctx.headers,
        }),
      ),
    ),

  changePassword: protectedProcedure
    .input(
      z.object({ currentPassword: z.string(), newPassword: passwordSchema }),
    )
    .mutation(({ input, ctx }) =>
      callAuth(async () =>
        (await getAuth()).api.changePassword({
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
            revokeOtherSessions: true,
          },
          headers: ctx.headers,
        }),
      ),
    ),

  removePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const accounts = await db.account.findMany({
        where: { userId: ctx.session.user.id },
      });
      const credential = accounts.find((a) => a.providerId === "credential");

      if (!credential?.password) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No password has been set up for this account",
        });
      }

      if (accounts.length === 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Connect another sign-in method before removing your password",
        });
      }

      const { password } = await (await getAuth()).$context;
      const valid = await password.verify({
        hash: credential.password,
        password: input.currentPassword,
      });

      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Password is incorrect",
        });
      }

      await db.account.delete({ where: { id: credential.id } });
      return { success: true };
    }),

  setUsername: protectedProcedure
    .input(z.object({ name: usernameSchema }))
    .mutation(async ({ input, ctx }) => {
      if (input.name === ctx.session.user.username) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That is already your username",
        });
      }

      const taken = await db.user.findUnique({
        where: { username: input.name },
      });

      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const user = await db.user.update({
        where: { id: ctx.session.user.id },
        data: { username: input.name },
      });

      return { username: user.username };
    }),
});
