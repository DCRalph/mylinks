import { z } from "zod";
import { db } from "~/server/db";

import badWords from "~/utils/badWords";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

export const profileRouter = createTRPCRouter({
  getProfiles: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await db.profile.findMany({
      where: {
        userId: ctx.session?.user.id,
      },
      include: {
        profileLinks: true,
      },
    });

    return {
      profiles,
    };
  }),

  createProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        altName: z.string().nullable(),
        slug: z.string(),
        bio: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, altName, slug, bio } = input;

      if (badWords.badSlugs.includes(slug)) {
        throw new Error("Slug is not allowed");
      }

      const existingProfile = await db.profile.findFirst({
        where: {
          slug,
        },
      });

      if (existingProfile) {
        throw new Error("Slug is already taken");
      }

      const profile = await db.profile.create({
        data: {
          userId: ctx.session.user.id,
          name,
          altName,
          slug,
          bio,
          linkOrder: "[]",
        },
      });

      return {
        profile,
      };
    }),

  editProfile: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        altName: z.string().nullable(),
        slug: z.string(),
        bio: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, name, altName, slug, bio } = input;

      if (badWords.badSlugs.includes(slug)) {
        throw new Error("Slug is not allowed");
      }

      const existingProfile = await db.profile.findFirst({
        where: {
          slug,
        },
      });

      if (existingProfile && existingProfile.id !== id) {
        throw new Error("Slug is already taken");
      }

      const profile = await db.profile.findUnique({
        where: {
          userId: ctx.session?.user.id,
          id,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      await db.profile.update({
        where: {
          id,
        },
        data: {
          name,
          altName,
          slug,
          bio,
        },
      });

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
          userId: ctx.session?.user.id,
          id,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
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
    .input(
      z.object({
        profileId: z.string(),
        title: z.string(),
        url: z.string(),
        description: z.string(),
        bgColor: z.string(),
        fgColor: z.string(),
        iconUrl: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { profileId, title, url, description, bgColor, fgColor, iconUrl } =
        input;

      const profile = await db.profile.findFirst({
        where: {
          userId: ctx.session.user.id,
          id: profileId,
        },
        include: {
          profileLinks: true,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      const profileLink = await db.profileLink.create({
        data: {
          profileId: profileId,

          title,
          url,
          description,
          bgColor,
          fgColor,
          iconUrl,
        },
      });

      const linkOrder = parseProfileLinkOrder({
        linkOrderS: profile.linkOrder,
        profileLinks: profile.profileLinks,
      });

      linkOrder.push(profileLink.id);

      await db.profile.update({
        where: {
          id: profileId,
        },
        data: {
          linkOrder: JSON.stringify(linkOrder),
        },
      });

      return {
        profileLink,
      };
    }),

  editProfileLink: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        description: z.string(),
        bgColor: z.string(),
        fgColor: z.string(),
        iconUrl: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, title, url, description, bgColor, fgColor, iconUrl } = input;

      const profileLink = await db.profileLink.findUnique({
        where: {
          id,
        },
        include: {
          profile: true,
        },
      });

      if (!profileLink) {
        throw new Error("Link not found");
      }

      if (profileLink.profile.userId !== ctx.session?.user.id) {
        throw new Error("Not authorized");
      }

      await db.profileLink.update({
        where: {
          id,
        },
        data: {
          title,
          url,
          description,
          bgColor,
          fgColor,
          iconUrl,
        },
      });

      return {
        success: true,
      };
    }),

  changeOrder: protectedProcedure
    .input(z.object({ profileId: z.string(), order: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const { profileId, order } = input;

      const profile = await db.profile.findFirst({
        where: {
          userId: ctx.session.user.id,
          id: profileId,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      await db.profile.update({
        where: {
          id: profileId,
        },
        data: {
          linkOrder: JSON.stringify(order),
        },
      });

      return {
        success: true,
      };
    }),

  toggleProfileLinkVisibility: protectedProcedure
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
        throw new Error("Link not found");
      }

      if (profileLink.profile.userId !== ctx.session?.user.id) {
        throw new Error("Not authorized");
      }

      await db.profileLink.update({
        where: {
          id,
        },
        data: {
          visible: !profileLink.visible,
        },
      });

      return {
        success: true,
        visible: !profileLink.visible,
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
          profile: {
            include: {
              profileLinks: true,
            },
          },
        },
      });

      if (!profileLink) {
        throw new Error("Link not found");
      }

      if (profileLink.profile.userId !== ctx.session?.user.id) {
        throw new Error("Not authorized");
      }

      await db.profileLink.delete({
        where: {
          id,
        },
      });

      const linkOrder = parseProfileLinkOrder({
        linkOrderS: profileLink.profile.linkOrder,
        profileLinks: profileLink.profile.profileLinks,
      });

      const index = linkOrder.indexOf(id);
      if (index > -1) {
        linkOrder.splice(index, 1);
      }

      await db.profile.update({
        where: {
          id: profileLink.profileId,
        },
        data: {
          linkOrder: JSON.stringify(linkOrder),
        },
      });

      return {
        success: true,
      };
    }),

  getClicks: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const profile = await db.profile.findUnique({
        where: {
          userId: ctx.session.user.id,
          id,
        },
        include: {
          clicks: true,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      return {
        clicks: profile.clicks,
      };
    }),
});
