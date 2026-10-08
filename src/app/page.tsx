import { IconArrowUpRight } from "@tabler/icons-react";
import Link from "next/link";

import Brand from "~/components/Brand";
import ProfileView from "~/components/Profiles/ProfileView";
import { Button } from "~/components/ui/button";
import { ticketTextSize } from "~/lib/format";
import { cn } from "~/lib/utils";
import { getSession } from "~/server/auth";
import { getDomains } from "~/server/domains";

const FEATURES = [
  {
    title: "Short links",
    body: "Pick a slug or get a random one. Every link works on every domain you run.",
  },
  {
    title: "Profiles",
    body: "A link-in-bio page at /p/you, with buttons in your own colours.",
  },
  {
    title: "Analytics",
    body: "Clicks per day, where they came from and what they were on.",
  },
  {
    title: "Bookmarks",
    body: "Folders you can drag things into, waiting in any browser.",
  },
];

const DEMO_TICKETS = [
  { slug: "launch", name: "Launch post", clicks: "1,284" },
  { slug: "cv", name: "Resume", clicks: "211" },
  { slug: "chat", name: "Discord", clicks: "97" },
];

const DEMO_PROFILE = [
  {
    title: "GitHub",
    url: "#",
    description: "Open source",
    bgColor: "#f4f4ee",
    fgColor: "#0b0b0a",
  },
  {
    title: "YouTube",
    url: "#",
    description: "Build logs",
    bgColor: "#ff0033",
    fgColor: "#ffffff",
  },
  {
    title: "Email me",
    url: "#",
    description: null,
    bgColor: "#c8f560",
    fgColor: "#0b0b0a",
  },
].map((link) => ({ ...link, id: link.title, iconUrl: null }));

export default async function Home() {
  const signedIn = !!(await getSession());
  const host = (await getDomains()).active[0].host;
  const cta = signedIn
    ? { href: "/dashboard", label: "Open dashboard" }
    : { href: "/signin", label: "Get started" };

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex h-[72px] max-w-6xl items-center px-5 sm:px-8">
        <Brand />
        <Button
          variant={signedIn ? "default" : "outline"}
          size="sm"
          className="ml-auto"
          asChild
        >
          <Link href={signedIn ? "/dashboard" : "/signin"}>
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16">
        <h1 className="display text-[clamp(76px,14vw,200px)] leading-[1.15]">
          Short links.
          <br />
          <span className="text-lime">Loud pages.</span>
        </h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <p className="text-muted max-w-md text-lg">
            Shorten links on your own domains, see who clicks, and put
            everything you make on one page.
          </p>
          <Button size="lg" asChild>
            <Link href={cta.href}>
              {cta.label} <IconArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-hidden="true"
        className="mx-auto grid max-w-6xl gap-3.5 px-5 sm:grid-cols-3 sm:px-8"
      >
        {DEMO_TICKETS.map((ticket, i) => (
          <div
            key={ticket.slug}
            className={cn(
              "flex min-h-[168px] flex-col rounded-2xl p-5",
              i === 0 ? "bg-lime text-lime-ink" : "bg-panel",
            )}
          >
            <p
              className={cn(
                "display truncate-display",
                ticketTextSize(`${host}/${ticket.slug}`),
              )}
            >
              {host}/{ticket.slug}
            </p>
            <p className="mt-1.5 font-semibold">{ticket.name}</p>
            <p className="display mt-auto text-[40px]">
              {ticket.clicks}
              <span className="ml-1.5 text-base">clicks</span>
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <div key={feature.title}>
              <p className="display text-lime text-2xl">0{i + 1}</p>
              <h2 className="display mt-1 text-[44px] leading-none">
                {feature.title}
              </h2>
              <p className="text-muted mt-3 max-w-xs">{feature.body}</p>
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="border-line pointer-events-none mx-auto h-[540px] w-full max-w-[340px] overflow-hidden rounded-[32px] border-[1.5px]"
        >
          <ProfileView
            compact
            name="Sam Rivera"
            bio="Photographer in Wellington. Prints, workshops and the odd video."
            links={DEMO_PROFILE}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="bg-lime text-lime-ink flex flex-col items-start gap-8 rounded-2xl p-8 sm:p-12">
          <h2 className="display text-[clamp(56px,9vw,120px)] leading-[1.15]">
            Make your first link.
          </h2>
          <Button
            size="lg"
            className="bg-lime-ink text-lime hover:bg-lime-ink/85"
            asChild
          >
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="border-line text-muted flex flex-wrap items-center justify-between gap-4 border-t py-8 text-sm">
          <Brand className="text-2xl" />
          <p>
            Made by{" "}
            <a
              href="https://williamgiles.co.nz"
              target="_blank"
              rel="noreferrer"
              className="text-ink hover:text-lime"
            >
              William
            </a>{" "}
            in New Zealand
          </p>
        </div>
      </footer>
    </main>
  );
}
