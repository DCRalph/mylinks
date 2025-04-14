import { z } from "zod";
import { db } from "~/server/db";

import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

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
      orderBy: {
        email: "asc",
      },
    });

    return data;
  }),

  updateUsername: adminProcedure
    .input(
      z.object({
        userID: z.string(),
        username: z.string().min(3).max(20),
      }),
    )
    .mutation(async ({ input }) => {
      const { userID, username } = input;

      // Check if username is already taken
      const existingUser = await db.user.findFirst({
        where: {
          username,
          NOT: {
            id: userID,
          },
        },
      });

      if (existingUser) {
        throw new Error("Username already taken");
      }

      // Update the user
      const updatedUser = await db.user.update({
        where: {
          id: userID,
        },
        data: {
          username,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  toggleAdminStatus: adminProcedure
    .input(z.object({ userID: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userID } = input;

      // Don't allow self-demotion
      if (userID === ctx.session.user.id) {
        throw new Error("Cannot change your own admin status");
      }

      // Get current user to toggle status
      const user = await db.user.findUnique({
        where: {
          id: userID,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Toggle admin status
      const updatedUser = await db.user.update({
        where: {
          id: userID,
        },
        data: {
          admin: !user.admin,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  toggleSpyPixelStatus: adminProcedure
    .input(z.object({ userID: z.string() }))
    .mutation(async ({ input }) => {
      const { userID } = input;

      // Get current user to toggle status
      const user = await db.user.findUnique({
        where: {
          id: userID,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Toggle spyPixel status
      const updatedUser = await db.user.update({
        where: {
          id: userID,
        },
        data: {
          spyPixel: !user.spyPixel,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  // New mutations for managing user links
  updateLink: adminProcedure
    .input(
      z.object({
        linkID: z.string(),
        name: z.string().min(1).max(50),
        url: z.string().url(),
        slug: z.string().min(1).max(50).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { linkID, name, url, slug } = input;

      // Check if slug is already taken (if provided)
      if (slug) {
        const existingLink = await db.link.findFirst({
          where: {
            slug,
            NOT: {
              id: linkID,
            },
          },
        });

        if (existingLink) {
          throw new Error("Slug already taken");
        }
      }

      // Update the link
      const updatedLink = await db.link.update({
        where: {
          id: linkID,
        },
        data: {
          name,
          url,
          ...(slug && { slug }),
        },
      });

      return {
        success: true,
        link: updatedLink,
      };
    }),

  deleteLink: adminProcedure
    .input(z.object({ linkID: z.string() }))
    .mutation(async ({ input }) => {
      const { linkID } = input;

      // Delete the link
      await db.link.delete({
        where: {
          id: linkID,
        },
      });

      return {
        success: true,
      };
    }),

  // Admin mutations for managing profiles
  updateProfile: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        altName: z.string().nullable(),
        slug: z.string(),
        bio: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, name, altName, slug, bio } = input;

      const profile = await db.profile.findUnique({
        where: {
          id,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Check if slug is already taken by another profile
      const existingProfile = await db.profile.findFirst({
        where: {
          slug,
          NOT: {
            id,
          },
        },
      });

      if (existingProfile) {
        throw new Error("Slug is already taken");
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

  deleteProfile: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const profile = await db.profile.findUnique({
        where: {
          id,
        },
        include: {
          profileLinks: true,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Delete all profile links first
      await db.profileLink.deleteMany({
        where: {
          profileId: id,
        },
      });

      // Then delete the profile
      await db.profile.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
      };
    }),

  // Admin mutations for managing profile links
  updateProfileLink: adminProcedure
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
    .mutation(async ({ input }) => {
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

  toggleProfileLinkVisibility: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
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

  deleteProfileLink: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
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

  createProfileLink: adminProcedure
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
    .mutation(async ({ input }) => {
      const { profileId, title, url, description, bgColor, fgColor, iconUrl } =
        input;

      const profile = await db.profile.findUnique({
        where: {
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
          profileId,
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
});
