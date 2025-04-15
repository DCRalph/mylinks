import { z } from "zod";
import { db } from "~/server/db";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import badWords from "~/utils/badWords";
import { TRPCError } from "@trpc/server";
import { hash, compare } from "bcryptjs";

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
      include: {
        accounts: true,
      },
    });

    return {
      user,
    };
  }),

  getUserAccounts: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await db.account.findMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return accounts;
  }),

  exportUserData: protectedProcedure.query(async ({ ctx }) => {

    const includeClicks = false

    // Get user data
    const user = await db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        accounts: {
          select: {
            id: true,
            provider: true,
            type: true,
            providerAccountId: true,
            // Exclude sensitive data like password
          },
        },
        Links: {
          include: {
            clicks: includeClicks,
          },
        },
        Profiles: {
          include: {
            profileLinks: true,
            clicks: includeClicks,
          },
        },
        bookmarks: {
          include: {
            tags: true,
          },
        },
        bookmarkFolder: true,
        SpyPixels: {
          include: {
            clicks: includeClicks,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Create a sanitized version that removes sensitive data
    const sanitizedData = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accounts: user.accounts.map((account) => ({
        provider: account.provider,
        type: account.type,
      })),
      links: user.Links,
      profiles: user.Profiles,
      bookmarks: user.bookmarks,
      bookmarkFolders: user.bookmarkFolder,
      spyPixels: user.SpyPixels.length > 0 ? user.SpyPixels : undefined,
    };

    return sanitizedData;
  }),

  hasCredentialsAccount: protectedProcedure.query(async ({ ctx }) => {
    const credentialsAccount = await db.account.findFirst({
      where: {
        userId: ctx.session.user.id,
        provider: "credentials",
      },
    });

    return {
      hasCredentials: !!credentialsAccount,
      account: credentialsAccount,
    };
  }),

  createPassword: protectedProcedure
    .input(
      z.object({
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has credentials account
      const existingCredentials = await db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          provider: "credentials",
        },
      });

      if (existingCredentials) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a password set up",
        });
      }

      // Get user's email
      const user = await db.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });

      if (!user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your account doesn't have an email",
        });
      }

      // Hash the password
      const hashedPassword = await hash(input.password, 10);

      // Create a credentials account
      await db.account.create({
        data: {
          userId: ctx.session.user.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: user.email,
          password: hashedPassword,
        },
      });

      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z
          .string()
          .min(8, "New password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get the credentials account
      const credentialsAccount = await db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          provider: "credentials",
        },
      });

      if (!credentialsAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No password has been set up for this account",
        });
      }

      // Verify current password
      const isPasswordValid =
        credentialsAccount.password &&
        (await compare(input.currentPassword, credentialsAccount.password));

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash the new password
      const hashedPassword = await hash(input.newPassword, 10);

      // Update password
      await db.account.update({
        where: {
          id: credentialsAccount.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      return { success: true };
    }),

  removePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Get the credentials account
      const credentialsAccount = await db.account.findFirst({
        where: {
          userId: ctx.session.user.id,
          provider: "credentials",
        },
      });

      if (!credentialsAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No password has been set up for this account",
        });
      }

      // Verify password
      const isPasswordValid =
        credentialsAccount.password &&
        (await compare(input.currentPassword, credentialsAccount.password));

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Password is incorrect",
        });
      }

      // Check if user has other auth methods
      const otherAccounts = await db.account.findMany({
        where: {
          userId: ctx.session.user.id,
          provider: { not: "credentials" },
        },
      });

      if (otherAccounts.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove the only authentication method",
        });
      }

      // Delete credentials account
      await db.account.delete({
        where: {
          id: credentialsAccount.id,
        },
      });

      return { success: true };
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
