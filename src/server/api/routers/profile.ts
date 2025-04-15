import { z } from "zod";
import { db } from "~/server/db";
import badWords from "~/utils/badWords";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

// Get date with timezone adjustment to UTC
function getUTCAdjustedDate(date: Date): Date {
  const newDate = new Date(date);
  // Remove timezone offset to work with UTC dates
  newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
  return newDate;
}

// Get start of day in UTC
function getStartOfDay(date: Date): Date {
  const newDate = getUTCAdjustedDate(date);
  newDate.setUTCHours(0, 0, 0, 0);
  return newDate;
}

// Get end of day in UTC
function getEndOfDay(date: Date): Date {
  const newDate = getUTCAdjustedDate(date);
  newDate.setUTCHours(23, 59, 59, 999);
  return newDate;
}

// Helper to get full date range (filled with zeros for days with no data)
function getDateRange(
  startDate: Date,
  endDate: Date,
): { date: string; timestamp: Date }[] {
  const dates = [];
  const currentDate = getStartOfDay(startDate);
  const adjustedEndDate = getEndOfDay(endDate);

  while (currentDate <= adjustedEndDate) {
    dates.push({
      date: formatDate(currentDate),
      timestamp: new Date(currentDate),
    });
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
}

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

      if (
        profileLink.profile.userId !== ctx.session?.user.id &&
        ctx.session?.user.admin
      ) {
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

      // check if users ids match or if user is admin
      // but if user is a admin, they can toggle any link

      if (
        profileLink.profile.userId !== ctx.session?.user.id &&
        !ctx.session?.user.admin
      ) {
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

  getPublicProfile: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const { slug } = input;

      const profile = await db.profile.findUnique({
        where: {
          slug,
        },
        include: {
          profileLinks: true,
        },
      });

      if (!profile) {
        return null;
      }

      // Filter visible links
      profile.profileLinks = profile.profileLinks.filter(
        (link) => link.visible,
      );

      // Track the visit (without needing headers)
      db.click
        .create({
          data: {
            profileId: profile.id,
            userAgent: ctx.headers.get("user-agent") ?? "unknown",
            ipAddress: ctx.headers.get("x-forwarded-for") ?? "unknown",
            referer: ctx.headers.get("referer") ?? "unknown",
          },
        })
        .catch((err) => {
          console.error(err);
        });

      return profile;
    }),

  getProfileAnalytics: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        days: z.number().min(1).max(30).default(7),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { profileId, days } = input;

      const profile = await db.profile.findUnique({
        where: { id: profileId, userId: ctx.session.user.id },
        select: { id: true, userId: true },
      });

      if (!profile) return null;

      // Get date range for analytics with timezone adjustments
      const now = new Date();

      // End date is current day at 23:59:59.999 UTC
      const endDate = getEndOfDay(now);

      // Start date is (days-1) days ago at 00:00:00.000 UTC
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - (days - 1));
      const adjustedStartDate = getStartOfDay(startDate);

      // Create full date range with all days (in UTC)
      const dateRange = getDateRange(adjustedStartDate, endDate);

      // Get click data
      const clickData = await db.click.findMany({
        where: {
          profileId: profileId,
          createdAt: {
            gte: adjustedStartDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // Group clicks by day - adjusted for UTC
      const clicksByDay: Record<string, number> = {};

      // Initialize all days with zero clicks
      dateRange.forEach((day) => {
        clicksByDay[day.date] = 0;
      });

      // Count clicks for each day (format as UTC date to match our date range)
      clickData.forEach((click) => {
        // We need to adjust the date to UTC to match our date range keys
        const utcAdjustedDate = getUTCAdjustedDate(click.createdAt);
        const dateStr = formatDate(utcAdjustedDate);

        if (clicksByDay[dateStr] !== undefined) {
          clicksByDay[dateStr] += 1;
        }
      });

      // Create the final formatted data with all days included
      const formattedData = dateRange.map((day) => ({
        date: day.date,
        timestamp: day.timestamp,
        count: clicksByDay[day.date] ?? 0,
      }));

      // Get total clicks
      const totalClicks = await db.click.count({
        where: {
          profileId: profileId,
        },
      });

      // Get recent growth rate (comparing to previous period)
      const previousStartDate = new Date(adjustedStartDate);
      previousStartDate.setUTCDate(previousStartDate.getUTCDate() - days);

      const currentPeriodClicks = await db.click.count({
        where: {
          profileId: profileId,
          createdAt: {
            gte: adjustedStartDate,
            lte: endDate,
          },
        },
      });

      const previousPeriodClicks = await db.click.count({
        where: {
          profileId: profileId,
          createdAt: {
            gte: previousStartDate,
            lt: adjustedStartDate,
          },
        },
      });

      // Calculate growth percentage
      const growthPercentage =
        previousPeriodClicks === 0
          ? currentPeriodClicks > 0
            ? 100 // If previous was 0 and current has clicks, 100% growth
            : 0 // If both are 0, 0% growth
          : ((currentPeriodClicks - previousPeriodClicks) /
              previousPeriodClicks) *
            100;

      return {
        clicksByDay: formattedData,
        totalClicks,
        currentPeriodClicks,
        previousPeriodClicks,
        growthPercentage: Math.round(growthPercentage * 100) / 100, // Round to 2 decimal places
        timeframe: days,
        // Include the actual start and end dates for reference
        dateRange: {
          start: adjustedStartDate.toISOString(),
          end: endDate.toISOString(),
        },
      };
    }),

  getTrafficSources: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        days: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { profileId, days } = input;

      // Check if the user owns this profile
      const profile = await db.profile.findUnique({
        where: {
          id: profileId,
          userId: ctx.session.user.id,
        },
      });

      if (!profile) {
        throw new Error("Profile not found or you don't have access to it");
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get referrer data
      const referrers = await db.$queryRaw<
        { referer: string; count: bigint }[]
      >`
        SELECT 
          referer, 
          COUNT(*) as count 
        FROM Click 
        WHERE 
          profileId = ${profileId} 
          AND createdAt >= ${startDate} 
          AND createdAt <= ${endDate}
        GROUP BY referer
        ORDER BY count DESC
        LIMIT 5
      `;

      // Get user agent data (for device types)
      const userAgents = await db.$queryRaw<
        { userAgent: string; count: bigint }[]
      >`
        SELECT 
          userAgent, 
          COUNT(*) as count 
        FROM Click 
        WHERE 
          profileId = ${profileId} 
          AND createdAt >= ${startDate} 
          AND createdAt <= ${endDate}
        GROUP BY userAgent
        ORDER BY count DESC
        LIMIT 10
      `;

      // Simplify user agents into device categories
      const deviceData = userAgents.reduce(
        (acc: { device: string; count: number }[], { userAgent, count }) => {
          let deviceType = "Unknown";

          if (userAgent.includes("client-side-visit")) {
            deviceType = "Web App";
          } else if (
            userAgent.toLowerCase().includes("mobile") ||
            userAgent.toLowerCase().includes("android") ||
            userAgent.toLowerCase().includes("iphone")
          ) {
            deviceType = "Mobile";
          } else if (
            userAgent.toLowerCase().includes("tablet") ||
            userAgent.toLowerCase().includes("ipad")
          ) {
            deviceType = "Tablet";
          } else if (
            userAgent.toLowerCase().includes("windows") ||
            userAgent.toLowerCase().includes("macintosh") ||
            userAgent.toLowerCase().includes("linux")
          ) {
            deviceType = "Desktop";
          }

          // Add to the existing count or create new entry
          const existingEntry = acc.find((item) => item.device === deviceType);
          if (existingEntry) {
            existingEntry.count += Number(count);
          } else {
            acc.push({ device: deviceType, count: Number(count) });
          }

          return acc;
        },
        [],
      );

      return {
        trafficSources: referrers.map((item) => ({
          source: item.referer === "client-api" ? "Direct" : item.referer,
          count: Number(item.count),
        })),
        deviceTypes: deviceData.sort((a, b) => b.count - a.count),
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    }),

  getHourlyStats: protectedProcedure
    .input(
      z.object({
        profileId: z.string(),
        days: z.number().min(1).max(7).default(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { profileId, days } = input;

      // Check if the user owns this profile
      const profile = await db.profile.findUnique({
        where: {
          id: profileId,
          userId: ctx.session.user.id,
        },
      });

      if (!profile) {
        throw new Error("Profile not found or you don't have access to it");
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get hourly distribution
      const hourlyData = await db.$queryRaw<{ hour: number; count: bigint }[]>`
        SELECT 
          HOUR(createdAt) as hour, 
          COUNT(*) as count 
        FROM Click 
        WHERE 
          profileId = ${profileId} 
          AND createdAt >= ${startDate} 
          AND createdAt <= ${endDate}
        GROUP BY HOUR(createdAt)
        ORDER BY hour ASC
      `;

      // Fill in all 24 hours (with 0 for hours with no data)
      const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
        const foundData = hourlyData.find((item) => Number(item.hour) === hour);
        return {
          hour,
          count: foundData ? Number(foundData.count) : 0,
        };
      });

      return {
        hourlyStats,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    }),
});
