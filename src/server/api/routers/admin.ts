import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { linkUrlSchema, slugSchema, usernameSchema } from "~/lib/validation";
import { profileLinkInput } from "~/server/api/routers/profile";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

const conflict = (message: string) =>
  new TRPCError({ code: "CONFLICT", message });

const notFound = (message: string) =>
  new TRPCError({ code: "NOT_FOUND", message });

export const adminRouter = createTRPCRouter({
  getUser: adminProcedure
    .input(z.object({ userID: z.string() }))
    .query(async ({ input }) => {
      const user = await db.user.findUnique({
        where: { id: input.userID },
        include: {
          accounts: { select: { providerId: true } },
          Links: true,
          Profiles: { include: { profileLinks: true } },
        },
      });

      return { user };
    }),

  getUsers: adminProcedure.query(() =>
    db.user.findMany({
      include: {
        accounts: { select: { providerId: true } },
        Links: true,
        Profiles: true,
      },
      orderBy: { email: "asc" },
    }),
  ),

  updateUsername: adminProcedure
    .input(z.object({ userID: z.string(), username: usernameSchema }))
    .mutation(async ({ input }) => {
      const taken = await db.user.findFirst({
        where: { username: input.username, NOT: { id: input.userID } },
      });
      if (taken) throw conflict("Username already taken");

      const user = await db.user.update({
        where: { id: input.userID },
        data: { username: input.username },
      });

      return { success: true, user };
    }),

  toggleAdminStatus: adminProcedure
    .input(z.object({ userID: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userID === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change your own admin status",
        });
      }

      const user = await db.user.findUnique({ where: { id: input.userID } });
      if (!user) throw notFound("User not found");

      const updated = await db.user.update({
        where: { id: input.userID },
        data: { admin: !user.admin },
      });

      return { success: true, user: updated };
    }),

  toggleSpyPixelStatus: adminProcedure
    .input(z.object({ userID: z.string() }))
    .mutation(async ({ input }) => {
      const user = await db.user.findUnique({ where: { id: input.userID } });
      if (!user) throw notFound("User not found");

      const updated = await db.user.update({
        where: { id: input.userID },
        data: { spyPixel: !user.spyPixel },
      });

      return { success: true, user: updated };
    }),

  updateLink: adminProcedure
    .input(
      z.object({
        linkID: z.string(),
        name: z.string().trim().min(1).max(50),
        url: linkUrlSchema,
        slug: slugSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { linkID, name, url, slug } = input;

      if (slug) {
        const taken = await db.link.findFirst({
          where: { slug, NOT: { id: linkID } },
        });
        if (taken) throw conflict("Slug already taken");
      }

      const link = await db.link.update({
        where: { id: linkID },
        data: { name, url, ...(slug && { slug }) },
      });

      return { success: true, link };
    }),

  deleteLink: adminProcedure
    .input(z.object({ linkID: z.string() }))
    .mutation(async ({ input }) => {
      await db.link.delete({ where: { id: input.linkID } });
      return { success: true };
    }),

  updateProfile: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1).max(50),
        altName: z.string().trim().max(50).nullable(),
        slug: slugSchema.pipe(z.string().min(1, "Slug is required")),
        bio: z.string().trim().max(300).nullable(),
      }),
    )
    .mutation(async ({ input: { id, ...data } }) => {
      const taken = await db.profile.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (taken) throw conflict("Slug is already taken");

      await db.profile.update({ where: { id }, data });
      return { success: true };
    }),

  deleteProfile: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Profile links cascade.
      await db.profile.delete({ where: { id: input.id } });
      return { success: true };
    }),

  updateProfileLink: adminProcedure
    .input(profileLinkInput.extend({ id: z.string() }))
    .mutation(async ({ input: { id, ...data } }) => {
      await db.profileLink.update({ where: { id }, data });
      return { success: true };
    }),

  deleteProfileLink: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const link = await db.profileLink.findUnique({
        where: { id: input.id },
        include: { profile: { include: { profileLinks: true } } },
      });
      if (!link) throw notFound("Link not found");

      await db.profileLink.delete({ where: { id: input.id } });

      const linkOrder = parseProfileLinkOrder({
        linkOrderS: link.profile.linkOrder,
        profileLinks: link.profile.profileLinks,
      }).filter((id) => id !== input.id);

      await db.profile.update({
        where: { id: link.profileId },
        data: { linkOrder: JSON.stringify(linkOrder) },
      });

      return { success: true };
    }),

  createProfileLink: adminProcedure
    .input(profileLinkInput.extend({ profileId: z.string() }))
    .mutation(async ({ input: { profileId, ...data } }) => {
      const profile = await db.profile.findUnique({
        where: { id: profileId },
        include: { profileLinks: true },
      });
      if (!profile) throw notFound("Profile not found");

      const profileLink = await db.profileLink.create({
        data: { ...data, profileId },
      });

      const linkOrder = parseProfileLinkOrder({
        linkOrderS: profile.linkOrder,
        profileLinks: profile.profileLinks,
      });

      await db.profile.update({
        where: { id: profileId },
        data: { linkOrder: JSON.stringify([...linkOrder, profileLink.id]) },
      });

      return { profileLink };
    }),
});
