"use client";

import { useState } from "react";
import { Bar, BarChart, XAxis } from "recharts";

import Growth from "~/components/Growth";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { formatNumber } from "~/lib/format";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const RANGES = [7, 14, 30] as const;

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));

/** Views over time, top referrers and device mix for one profile. */
export default function ProfileAnalytics({ profileId }: { profileId: string }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const views = api.profile.getProfileAnalytics.useQuery({ profileId, days });
  const traffic = api.profile.getTrafficSources.useQuery({ profileId, days });

  const data = views.data;
  const chartData = (data?.clicksByDay ?? []).map((day) => ({
    label: dayLabel(day.date),
    views: day.count,
  }));

  return (
    <section className="rounded-2xl bg-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="display text-[28px]">Analytics</h2>
        <div className="flex rounded-xl border-[1.5px] border-line p-0.5">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={cn(
                "display h-8 cursor-pointer rounded-lg px-3 text-base",
                days === range ? "bg-ink text-bg" : "text-muted hover:text-ink",
              )}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-2">
        <div>
          <p className="display text-[64px] leading-none">
            {formatNumber(data?.currentPeriodClicks ?? 0)}
          </p>
          <p className="mt-2 flex gap-2 text-sm text-muted">
            views in {days} days
            <Growth value={Math.round(data?.growthPercentage ?? 0)} />
          </p>
        </div>
        <div>
          <p className="display text-[32px] leading-none text-muted">
            {formatNumber(data?.totalClicks ?? 0)}
          </p>
          <p className="mt-1 text-sm text-muted">all time</p>
        </div>
      </div>

      <ChartContainer
        config={{ views: { label: "Views", color: "var(--color-lime)" } }}
        className="mt-5 aspect-auto h-44 w-full"
      >
        <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-raised)" }}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="views" fill="var(--color-views)" radius={4} />
        </BarChart>
      </ChartContainer>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Breakdown
          title="Sources"
          rows={(traffic.data?.trafficSources ?? []).map((s) => ({
            label: s.source,
            count: s.count,
          }))}
        />
        <Breakdown
          title="Devices"
          rows={(traffic.data?.deviceTypes ?? []).map((d) => ({
            label: d.device,
            count: d.count,
          }))}
        />
      </div>
    </section>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div>
      <h3 className="display mb-2 text-xl text-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-faint">No visits yet.</p>
      ) : (
        <ul className="grid gap-1.5">
          {rows.map((row) => (
            <li
              key={row.label}
              className="relative flex h-9 items-center justify-between overflow-hidden rounded-lg bg-bg px-3 text-sm"
            >
              <span
                className="absolute inset-y-0 left-0 bg-lime/15"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
              <span className="relative truncate">{row.label}</span>
              <span className="relative font-semibold">
                {formatNumber(row.count)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
