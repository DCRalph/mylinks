"use client";

import { type Profile, type ProfileLink } from "@prisma/client";
import {
  IconExternalLink,
  IconChartLine,
  IconEye,
  IconArrowUpRight,
  IconChartBar,
  IconArrowUpRightCircle,
  IconTrendingUp,
  IconCalendar,
} from "@tabler/icons-react";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";
import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Profile_ProjectLinks = {
  profileLinks: ProfileLink[];
} & Profile;

export default function ProfilePage({
  profile,
}: {
  profile: Profile_ProjectLinks;
}) {
  const { data: session } = useSession();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const isOwner = session?.user?.id === profile.userId;

  const linkOrder = parseProfileLinkOrder({
    linkOrderS: profile.linkOrder,
    profileLinks: profile.profileLinks,
  });

  const orderedLinks = linkOrder
    .map((id) => {
      return profile.profileLinks.find((link) => link.id === id);
    })
    .filter((link) => link !== undefined);

  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Decorative Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>

      {/* Fixed Analytics Toggle Button for Owner */}
      {isOwner && (
        <div className="fixed bottom-8 right-8 z-20">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="glass-card flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20"
            aria-label={showAnalytics ? "Hide Analytics" : "Show Analytics"}
          >
            <IconChartBar size={20} />
            <span className="hidden sm:inline">
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </span>
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-16 sm:px-8">
        <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="relative z-10">
            <h1 className="sora mb-4 text-4xl font-bold tracking-tight text-white">
              {profile.name}
            </h1>

            {profile.bio != null && (
              <p className="mt-4 text-lg text-zinc-300">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Analytics Section - Separate Card */}
        {isOwner && showAnalytics && (
          <div className="mt-6">
            <ProfileAnalytics profileId={profile.id} />
          </div>
        )}
      </div>

      {/* Links Section */}
      {orderedLinks.length > 0 && (
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 sm:px-8">
          <div className="grid grid-cols-1 gap-4">
            {orderedLinks.map((link) => (
              <ProfileLinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      )}

      {/* CSS for Glassmorphism */}
      <style jsx global>{`
        .glass-card {
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
        }

        .glass-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0.15),
            rgba(255, 255, 255, 0.05),
            transparent,
            transparent
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </main>
  );
}

function ProfileAnalytics({ profileId }: { profileId: string }) {
  const [timeframe, setTimeframe] = useState(7);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data, isLoading, error } = api.profile.getProfileAnalytics.useQuery(
    { profileId, days: timeframe },
    {
      refetchOnWindowFocus: false,
      refetchInterval: 3600000, // Refresh hourly
    },
  );

  // Debug data to verify today's data is included
  useEffect(() => {
    if (data) {
      const today = new Date().toISOString().split("T")[0];
      const lastDayInData =
        data.clicksByDay.length > 0
          ? data.clicksByDay[data.clicksByDay.length - 1]
          : null;
      console.log("[ProfileAnalytics] Received data:", {
        timeframe,
        dateRange: data.dateRange,
        totalDays: data.clicksByDay?.length,
        lastDay: lastDayInData,
        today,
        hasToday: lastDayInData?.date === today,
      });
    }
  }, [data, timeframe]);

  // Force a refresh at midnight to update "today" data
  useEffect(() => {
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set a timeout to trigger refresh at midnight
    const timer = setTimeout(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <p className="text-center text-red-400">
          Error loading analytics: {error.message}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <p className="text-center text-zinc-400">No analytics available</p>
      </div>
    );
  }

  // Format timestamp to a readable date
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Check if a date is today in UTC terms
  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;

    // Get today's date in UTC format (YYYY-MM-DD)
    const today = new Date();
    const todayUTC = new Date(today);
    todayUTC.setMinutes(todayUTC.getMinutes() - todayUTC.getTimezoneOffset());
    const todayString = todayUTC.toISOString().split("T")[0];

    // Get the date from timestamp in UTC format
    const date = new Date(dateString);
    const dateUTC = date.toISOString().split("T")[0];

    return dateUTC === todayString;
  };

  // Ensure we have non-empty data
  if (!data.clicksByDay || data.clicksByDay.length === 0) {
    return (
      <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        <p className="text-center text-zinc-400">
          No data for the selected timeframe
        </p>
      </div>
    );
  }

  // Format data for shadcn chart
  const chartData = data.clicksByDay.map((day) => ({
    date: day.timestamp ? new Date(day.timestamp).getDate() : "?",
    views: day.count || 0,
    fullDate: day.timestamp ? formatDate(day.timestamp?.toString() || "") : "?",
    isToday: isToday(day.timestamp?.toString() || ""),
  }));

  // Define chart data type for TypeScript
  type ChartDataItem = {
    date: number | string;
    views: number;
    fullDate: string;
    isToday: boolean;
  };

  return (
    <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconChartLine className="h-5 w-5 text-blue-400" />
          <h3 className="sora text-lg font-medium text-white">
            Profile Analytics
          </h3>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`rounded-md px-3 py-1 text-xs transition ${
                timeframe === days
                  ? "bg-blue-600/80 text-white backdrop-blur-sm"
                  : "bg-white/10 text-zinc-300 hover:bg-white/20"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-lg bg-white/5 p-4 backdrop-blur-sm">
          <div className="rounded-full bg-blue-500/20 p-3 backdrop-blur-sm">
            <IconEye className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Total Views</p>
            <p className="text-2xl font-bold text-white">
              {data.totalClicks.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white/5 p-4 backdrop-blur-sm">
          <div className="rounded-full bg-green-500/20 p-3 backdrop-blur-sm">
            <IconTrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-zinc-400">Growth Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                {data.growthPercentage}%
              </p>
              <span className="text-xs text-zinc-400">
                vs. previous {timeframe} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe Info */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-300">Views over time</h4>
        {data.clicksByDay.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <IconCalendar size={14} />
            <span>
              {formatDate(data.clicksByDay[0]?.timestamp?.toString() ?? "")} -{" "}
              {formatDate(
                data.clicksByDay[
                  data.clicksByDay.length - 1
                ]?.timestamp?.toString() ?? "",
              )}
            </span>
          </div>
        )}
      </div>

      {/* ShadCN Chart */}
      <div className="mt-4">
        <ChartContainer
          config={{
            views: {
              color: "#4F46E5",
            },
            today: {
              color: "#818CF8",
            },
          }}
        >
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <Bar dataKey="views" radius={[4, 4, 0, 0]} fill="#4F46E5" />
              <XAxis dataKey="fullDate" tickLine={false} axisLine={true} />
              <YAxis />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Current Period Stats */}
      <div className="mt-5 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between">
          <span className="text-sm text-zinc-400">Current period views:</span>
          <span className="text-sm font-medium text-white">
            {data.currentPeriodClicks}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-zinc-400">Previous period views:</span>
          <span className="text-sm font-medium text-white">
            {data.previousPeriodClicks}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <IconArrowUpRightCircle
            size={16}
            className={
              data.growthPercentage >= 0 ? "text-green-400" : "text-red-400"
            }
          />
          <span
            className={`text-xs font-medium ${data.growthPercentage >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {data.growthPercentage >= 0
              ? `+${data.growthPercentage}%`
              : `${data.growthPercentage}%`}{" "}
            compared to previous period
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileLinkCard({ link }: { link: ProfileLink }) {
  const bgColor = link.bgColor ?? "#888888";
  const fgColor = link.fgColor ?? "#FFFFFF";
  const icon = link.iconUrl ? "/profileLinkIcons/" + link.iconUrl : undefined;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block transform transition-all hover:translate-y-[-2px]"
    >
      <div className="glass-card relative flex h-20 w-full cursor-pointer items-center gap-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10">
        <div
          className="aspect-square h-full rounded-lg p-2"
          style={{
            background: `${bgColor}`,
            color: fgColor,
          }}
        >
          {icon && (
            <Image
              src={icon}
              alt={link.title}
              className="h-full w-full"
              width={48}
              height={48}
            />
          )}
          {!icon && <IconExternalLink className="h-full w-full" />}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <h4 className="text-lg font-medium text-white">{link.title}</h4>
          {link.description && (
            <p className="text-sm text-zinc-300">{link.description}</p>
          )}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all group-hover:bg-white/20 group-hover:text-white">
          <IconArrowUpRight size={16} />
        </div>
      </div>
    </a>
  );
}

// Helper function to adjust color brightness for gradients
// function adjustColorBrightness(hex: string, percent: number) {
//   // Parse the hex color
//   let r = parseInt(hex.slice(1, 3), 16);
//   let g = parseInt(hex.slice(3, 5), 16);
//   let b = parseInt(hex.slice(5, 7), 16);

//   // Adjust brightness
//   r = Math.min(255, Math.max(0, r + percent));
//   g = Math.min(255, Math.max(0, g + percent));
//   b = Math.min(255, Math.max(0, b + percent));

//   // Convert back to hex
//   return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
// }
