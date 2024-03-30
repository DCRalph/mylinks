import { z } from "zod";
import { db } from "~/server/db";

import badWords from "~/utils/badWords";


import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getProfiles: protectedProcedure
    .query(async ({ ctx }) => {

      const profiles = await db.profile.findMany({
        where: {
          userId: ctx.session?.user.id,
        },
        include: {
          profileLinks: true,
        },
      });

      return {
        profiles
      }
    }),

  createProfile: protectedProcedure
    .input(z.object({ name: z.string(), slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { name, slug } = input;


      return {
        success: true,
      };
    }),

  editProfile: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string(), slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id, name, slug } = input;



      return {
        success: true,
      };
    }),

  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const profile = await db.profile.findUnique({
        where: {
          id,
        }
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      if (profile.userId !== ctx.session?.user.id) {
        throw new Error('Not authorized');
      }

      await db.profile.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
      };
    }),

  createProfileLink: protectedProcedure
    .input(z.object({ profileId: z.string(), title: z.string(), url: z.string(), showenUrl: z.string(), bgColor: z.string(), fgColor: z.string(), iconUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { profileId, title, url, showenUrl, bgColor, fgColor, iconUrl } = input;

      const profile = await db.profile.findFirst({
        where: {
          userId: ctx.session.user.id,
          id: profileId
        },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const profileLink = await db.profileLink.create({
        data: {
          profileId: profileId,
          order: 0,

          title,
          url,
          showenUrl,
          bgColor,
          fgColor,
          iconUrl,
        },
      });

      return {
        profileLink,
      };
    }),

  editProfileLink: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string(), url: z.string(), showenUrl: z.string(), bgColor: z.string(), fgColor: z.string(), iconUrl: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id, title, url, showenUrl, bgColor, fgColor, iconUrl } = input;

      const profileLink = await db.profileLink.findUnique({
        where: {
          id,
        },
        include: {
          profile: true,
        },
      });

      if (!profileLink) {
        throw new Error('Link not found');
      }

      if (profileLink.profile.userId !== ctx.session?.user.id) {
        throw new Error('Not authorized');
      }

      await db.profileLink.update({
        where: {
          id,
        },
        data: {
          title,
          url,
          showenUrl,
          bgColor,
          fgColor,
          iconUrl,
        },
      });

      return {
        success: true,
      };
    }),

  deleteProfileLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const profileLink = await db.profileLink.findUnique({
        where: {
          id,
        },
        include: {
          profile: true,
        },
      });

      if (!profileLink) {
        throw new Error('Link not found');
      }

      if (profileLink.profile.userId !== ctx.session?.user.id) {
        throw new Error('Not authorized');
      }

      await db.profileLink.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
      };
    }),
});
