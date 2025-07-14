"use client";

import { useState, useEffect } from "react";
import {
  IconChartLine,
  IconEye,
  IconArrowUpRightCircle,
  IconTrendingUp,
  IconCalendar,
} from "@tabler/icons-react";
import { api } from "~/trpc/react";
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
} from "recharts";

export default function ProfileAnalytics({ profileId }: { profileId: string }) {
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
              className={`rounded-md px-3 py-1 text-xs transition ${timeframe === days
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