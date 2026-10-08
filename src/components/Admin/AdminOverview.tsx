"use client";

import Link from "next/link";
import { Bar, BarChart, XAxis } from "recharts";

import Growth from "~/components/Growth";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { formatNumber, formatRelative, hostOf, plural } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";
import { Panel } from "./Panel";

const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));

/** /admin: this week's numbers, 30 days of clicks, top links and new accounts. */
export default function AdminOverview() {
  const [shareDomain] = useShareDomain();
  const [data] = api.admin.overview.useSuspenseQuery();

  const stats = [
    {
      label: "Users",
      value: data.users,
      note: data.newUsers ? `+${formatNumber(data.newUsers)}` : null,
    },
    {
      label: "Links",
      value: data.links,
      note: data.newLinks ? `+${formatNumber(data.newLinks)}` : null,
    },
    {
      label: "Clicks this week",
      value: data.clicks,
      growth: data.clicksGrowth,
      bots: data.bots,
    },
    { label: "Pixel loads this week", value: data.pixelLoads },
  ];

  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-panel rounded-2xl p-4 sm:p-5">
            <p className="display text-[40px] leading-[1.1] sm:text-[52px]">
              {formatNumber(stat.value)}
            </p>
            <p className="text-muted mt-1 flex flex-wrap gap-x-2 text-sm">
              {stat.label}
              {stat.note && (
                <span className="text-lime font-semibold">{stat.note}</span>
              )}
              {stat.growth !== undefined && <Growth value={stat.growth} />}
            </p>
            {!!stat.bots && (
              <p className="text-faint text-xs">
                + {plural(stat.bots, "bot")} not counted
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Clicks, 30 days"
          action={<span className="text-muted text-sm">bots left out</span>}
        >
          <ChartContainer
            config={{ people: { label: "Clicks", color: "var(--color-lime)" } }}
            className="aspect-auto h-52 w-full"
          >
            <BarChart
              data={data.days.map((day) => ({
                label: dayLabel(day.date),
                people: day.humans,
              }))}
              margin={{ left: 0, right: 0 }}
            >
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
              <Bar dataKey="people" fill="var(--color-people)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel title="Top links this week">
          {data.top.length === 0 ? (
            <p className="text-muted text-sm">No clicks this week.</p>
          ) : (
            <div className="divide-line -my-2.5 divide-y">
              {data.top.map((link) => (
                <Row key={link.id}>
                  <div className="min-w-0 flex-1">
                    <p className="display truncate-display text-xl">
                      {shareDomain.host}/{link.slug}
                    </p>
                    <p className="text-muted truncate text-[13px]">
                      @{link.user.username ?? link.user.name} ·{" "}
                      {hostOf(link.url)}
                    </p>
                  </div>
                  <p className="display text-[26px]">
                    {formatNumber(link.weekClicks)}
                  </p>
                </Row>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Newest users" className="lg:col-start-2">
          <div className="divide-line -my-2.5 divide-y">
            {data.newest.map((user) => (
              <Row key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="display bg-raised grid size-9 shrink-0 place-items-center rounded-full text-lg">
                    {user.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold group-hover:underline">
                      {user.name}
                    </span>
                    <span className="text-muted block truncate text-[13px]">
                      {user.email}
                    </span>
                  </span>
                </Link>
                <p className="text-muted shrink-0 text-[13px]">
                  {formatRelative(user.createdAt)}
                </p>
              </Row>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 py-2.5">{children}</div>;
}
