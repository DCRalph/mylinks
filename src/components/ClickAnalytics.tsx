"use client";

import { Bar, BarChart, XAxis } from "recharts";

import Growth from "~/components/Growth";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { formatNumber, plural } from "~/lib/format";
import { cn } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

type Analytics = RouterOutputs["link"]["getAnalytics"];

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) => {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

/**
 * People per day with bots stacked on top, and where the people came from.
 * The parent owns the range and the query (link stats, profile editor).
 */
export default function ClickAnalytics({
  noun,
  days,
  onDaysChange,
  data,
}: {
  /** "clicks" for links, "views" for profiles. */
  noun: string;
  days: Range;
  onDaysChange: (days: Range) => void;
  data: Analytics | undefined;
}) {
  const chartData = (data?.days ?? []).map((day) => ({
    label: dayLabel(day.date),
    people: day.humans,
    bots: day.bots,
  }));
  const countries = (data?.countries ?? []).filter(
    (row) => row.label !== "Unknown",
  );

  return (
    <section className="bg-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="display text-[28px]">Analytics</h2>
        <div className="border-line flex rounded-xl border-[1.5px] p-0.5">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => onDaysChange(range)}
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

      <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
        <div>
          <p className="display text-[64px] leading-none">
            {formatNumber(data?.humans ?? 0)}
          </p>
          <p className="text-muted mt-2 flex gap-2 text-sm">
            {noun} in {days} days
            <Growth value={data?.growth ?? 0} />
          </p>
        </div>
        <div>
          <p className="display text-muted text-[32px] leading-none">
            {formatNumber(data?.allTimeHumans ?? 0)}
          </p>
          <p className="text-muted mt-1 text-sm">all time</p>
        </div>
        <div title="Link previews, crawlers and scripts. Not counted in the numbers above.">
          <p className="display text-faint text-[32px] leading-none">
            {formatNumber(data?.bots ?? 0)}
          </p>
          <p className="text-muted mt-1 text-sm">
            {data?.bots === 1 ? "bot" : "bots"} in {days} days
          </p>
        </div>
      </div>

      <ChartContainer
        config={{
          people: { label: "People", color: "var(--color-lime)" },
          bots: { label: "Bots", color: "var(--color-faint)" },
        }}
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
          <Bar dataKey="people" stackId="a" fill="var(--color-people)" />
          <Bar
            dataKey="bots"
            stackId="a"
            fill="var(--color-bots)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Breakdown title="Sources" rows={data?.sources ?? []} />
        <Breakdown title="Devices" rows={data?.devices ?? []} />
        <Breakdown title="Browsers" rows={data?.clients ?? []} />
        {countries.length > 0 && (
          <Breakdown
            title="Countries"
            rows={countries.map((row) => ({
              ...row,
              label: countryName(row.label),
            }))}
          />
        )}
      </div>
      {!!data?.bots && (
        <p className="text-faint mt-5 text-xs">
          {plural(data.bots, "bot")} (link previews, crawlers and scripts) left
          out of the people numbers and breakdowns.
        </p>
      )}
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
      <h3 className="display text-muted mb-2 text-xl">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-faint text-sm">No visits yet.</p>
      ) : (
        <ul className="grid gap-1.5">
          {rows.map((row) => (
            <li
              key={row.label}
              className="bg-bg relative flex h-9 items-center justify-between overflow-hidden rounded-lg px-3 text-sm"
            >
              <span
                className="bg-lime/15 absolute inset-y-0 left-0"
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
