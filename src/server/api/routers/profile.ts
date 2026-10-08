import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { profileLinkUrlSchema, slugSchema } from "~/lib/validation";
import { assertSlugLength } from "~/server/api/slugs";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { visitorInfo } from "~/server/clicks";
import { db } from "~/server/db";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

const DAY_MS = 24 * 60 * 60 * 1000;

const profileInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  altName: z.string().trim().max(50).nullable(),
  slug: slugSchema.pipe(z.string().min(1, "Slug is required")),
  bio: z.string().trim().max(300).nullable(),
});

export const profileLinkInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(60),
  url: profileLinkUrlSchema,
  description: z.string().trim().max(120),
  bgColor: z.string(),
  fgColor: z.string(),
  iconUrl: z.string(),
});

/** UTC calendar day, e.g. "2026-10-08". */
const utcDay = (date: Date) => date.toISOString().slice(0, 10);

async function assertProfileSlugFree(slug: string, exceptId?: string) {
  const existing = await db.profile.findUnique({ where: { slug } });
  if (existing && existing.id !== exceptId) {
    throw new TRPCError({ code: "CONFLICT", message: "Slug is already taken" });
  }
}

async function findOwnProfile(id: string, userId: string) {
  const profile = await db.profile.findUnique({
    where: { id },
    include: { profileLinks: true },
  });
  if (profile?.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
  }
  return profile;
}

async function findOwnProfileLink(id: string, userId: string) {
  const link = await db.profileLink.findUnique({
    where: { id },
    include: { profile: { include: { profileLinks: true } } },
  });
  if (link?.profile.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Link not found" });
  }
  return link;
}

/** Rough device class from a user agent string. */
function deviceType(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone"))
    return "Mobile";
  if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux"))
    return "Desktop";
  return "Unknown";
}

export const profileRouter = createTRPCRouter({
  getProfiles: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await db.profile.findMany({
      where: { userId: ctx.session.user.id },
      include: { profileLinks: true, _count: { select: { clicks: true } } },
    });

    return { profiles };
  }),

  createProfile: protectedProcedure
    .input(profileInput)
    .mutation(async ({ input, ctx }) => {
      assertSlugLength(input.slug, ctx.session.user.admin);
      await assertProfileSlugFree(input.slug);

      const profile = await db.profile.create({
        data: { ...input, userId: ctx.session.user.id, linkOrder: "[]" },
      });

      return { profile };
    }),

  editProfile: protectedProcedure
    .input(profileInput.extend({ id: z.string() }))
    .mutation(async ({ input: { id, ...data }, ctx }) => {
      await findOwnProfile(id, ctx.session.user.id);
      assertSlugLength(data.slug, ctx.session.user.admin);
      await assertProfileSlugFree(data.slug, id);

      await db.profile.update({ where: { id }, data });
      return { success: true };
    }),

  deleteProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await findOwnProfile(input.id, ctx.session.user.id);
      await db.profile.delete({ where: { id: input.id } });
      return { success: true };
    }),

  createProfileLink: protectedProcedure
    .input(profileLinkInput.extend({ profileId: z.string() }))
    .mutation(async ({ input: { profileId, ...data }, ctx }) => {
      const profile = await findOwnProfile(profileId, ctx.session.user.id);

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

  editProfileLink: protectedProcedure
    .input(profileLinkInput.extend({ id: z.string() }))
    .mutation(async ({ input: { id, ...data }, ctx }) => {
      await findOwnProfileLink(id, ctx.session.user.id);
      await db.profileLink.update({ where: { id }, data });
      return { success: true };
    }),

  changeOrder: protectedProcedure
    .input(z.object({ profileId: z.string(), order: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      const profile = await findOwnProfile(
        input.profileId,
        ctx.session.user.id,
      );

      // Only keep ids that belong to this profile.
      const ids = new Set(profile.profileLinks.map((link) => link.id));
      const order = input.order.filter((id) => ids.has(id));

      await db.profile.update({
        where: { id: input.profileId },
        data: { linkOrder: JSON.stringify(order) },
      });

      return { success: true };
    }),

  toggleProfileLinkVisibility: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const link = await findOwnProfileLink(input.id, ctx.session.user.id);

      await db.profileLink.update({
        where: { id: input.id },
        data: { visible: !link.visible },
      });

      return { success: true, visible: !link.visible };
    }),

  deleteProfileLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const link = await findOwnProfileLink(input.id, ctx.session.user.id);

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

  getClicks: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await findOwnProfile(input.id, ctx.session.user.id);

      const clicks = await db.click.findMany({
        where: { profileId: input.id },
        select: { id: true, createdAt: true, userAgent: true, referer: true },
        orderBy: { createdAt: "desc" },
      });

      return { clicks };
    }),

  /** Public profile page data. Also records the visit. */
  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const profile = await db.profile.findUnique({
        where: { slug: input.slug },
        include: { profileLinks: { where: { visible: true } } },
      });

      if (!profile) {
        return null;
      }

      void db.click
        .create({ data: { profileId: profile.id, ...visitorInfo(ctx.headers) } })
        .catch(console.error);

      return profile;
    }),

  /** Daily views for the last `days` days (UTC), plus growth vs the period before. */
  getProfileAnalytics: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        days: z.number().int().min(1).max(90).default(7),
      }),
    )
    .query(async ({ input, ctx }) => {
      await findOwnProfile(input.profileId, ctx.session.user.id);

      const today = new Date(`${utcDay(new Date())}T00:00:00.000Z`);
      const start = new Date(today.getTime() - (input.days - 1) * DAY_MS);
      const previousStart = new Date(start.getTime() - input.days * DAY_MS);

      const [clicks, totalClicks, previousPeriodClicks] = await Promise.all([
        db.click.findMany({
          where: { profileId: input.profileId, createdAt: { gte: start } },
          select: { createdAt: true },
        }),
        db.click.count({ where: { profileId: input.profileId } }),
        db.click.count({
          where: {
            profileId: input.profileId,
            createdAt: { gte: previousStart, lt: start },
          },
        }),
      ]);

      const counts = new Map<string, number>();
      for (const click of clicks) {
        const day = utcDay(click.createdAt);
        counts.set(day, (counts.get(day) ?? 0) + 1);
      }

      const clicksByDay = Array.from({ length: input.days }, (_, i) => {
        const date = utcDay(new Date(start.getTime() + i * DAY_MS));
        return { date, count: counts.get(date) ?? 0 };
      });

      const currentPeriodClicks = clicks.length;
      const growthPercentage =
        previousPeriodClicks === 0
          ? currentPeriodClicks > 0
            ? 100
            : 0
          : Math.round(
              ((currentPeriodClicks - previousPeriodClicks) /
                previousPeriodClicks) *
                10000,
            ) / 100;

      return {
        clicksByDay,
        totalClicks,
        currentPeriodClicks,
        previousPeriodClicks,
        growthPercentage,
        timeframe: input.days,
      };
    }),

  /** Top referrers and device mix over the last `days` days. */
  getTrafficSources: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        days: z.number().int().min(1).max(90).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      await findOwnProfile(input.profileId, ctx.session.user.id);

      const clicks = await db.click.findMany({
        where: {
          profileId: input.profileId,
          createdAt: { gte: new Date(Date.now() - input.days * DAY_MS) },
        },
        select: { referer: true, userAgent: true },
      });

      const tally = (keys: string[]) => {
        const counts = new Map<string, number>();
        for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
        return [...counts].sort((a, b) => b[1] - a[1]);
      };

      const sources = tally(
        clicks.map((click) => {
          if (!click.referer || click.referer === "unknown") return "Direct";
          try {
            return new URL(click.referer).host;
          } catch {
            return click.referer;
          }
        }),
      );

      return {
        trafficSources: sources
          .slice(0, 5)
          .map(([source, count]) => ({ source, count })),
        deviceTypes: tally(clicks.map((click) => deviceType(click.userAgent))).map(
          ([device, count]) => ({ device, count }),
        ),
      };
    }),
});
