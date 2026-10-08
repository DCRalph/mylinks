"use client";

import Link from "next/link";

import { formatNumber, formatRelative, hostOf } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { api } from "~/trpc/react";
import { Panel } from "./Panel";

/** /admin: headline numbers, the most clicked links and the newest accounts. */
export default function AdminOverview() {
  const [shareDomain] = useShareDomain();
  const [data] = api.admin.overview.useSuspenseQuery();

  const stats = [
    { label: "Users", value: data.users, added: data.newUsers },
    { label: "Links", value: data.links, added: data.newLinks },
    { label: "Profiles", value: data.profiles },
    { label: "Pixels", value: data.pixels },
  ];

  return (
    <>
      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-panel rounded-2xl p-4 sm:p-5">
            <p className="display text-[40px] leading-[1.1] sm:text-[52px]">
              {formatNumber(stat.value)}
            </p>
            <p className="text-muted mt-1 flex gap-2 text-sm">
              {stat.label}
              {!!stat.added && (
                <span className="text-lime font-semibold">
                  +{formatNumber(stat.added)} this week
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Top links">
          <div className="divide-line -my-2.5 divide-y">
            {data.top.map((link) => (
              <Row key={link.id}>
                <div className="min-w-0 flex-1">
                  <p className="display truncate-display text-xl">
                    {shareDomain.host}/{link.slug}
                  </p>
                  <p className="text-muted truncate text-[13px]">
                    @{link.user.username ?? link.user.name} · {hostOf(link.url)}
                  </p>
                </div>
                <p className="display text-[26px]">
                  {formatNumber(link._count.clicks)}
                </p>
              </Row>
            ))}
          </div>
        </Panel>

        <Panel title="Newest users">
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
