"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  IconArrowRight,
  IconBrandTwitter,
  IconChartBar,
  IconLink,
  IconBookmark,
  IconSparkles,
  IconBolt,
  IconTarget,
  IconStars,
} from "@tabler/icons-react";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import { api } from "~/trpc/react";
import ComingSoonSection, {
  type RoadmapFeature,
} from "~/components/ComingSoonSection";

export default function Home() {
  const myUser = api.user.getUser.useQuery();

  const roadmapFeatures: RoadmapFeature[] = [
    {
      id: "custom-links",
      title: "Custom Short Links",
      description: "Create branded, memorable links that are easy to share.",
      status: "completed",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    {
      id: "bookmarks",
      title: "Bookmarks",
      description: "Save and organize your favorite links in one place.",
      status: "completed",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
    {
      id: "analytics",
      title: "Advanced Analytics Dashboard",
      description:
        "Detailed insights with visual charts and export capabilities.",
      status: "in-progress",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "redesign",
      title: "Full Site Redesign",
      description:
        "A complete overhaul with modern UI, improved navigation, and enhanced user experience.",
      status: "in-progress",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
      ),
    },
    {
      id: "better-account-management",
      title: "Better Account Management",
      description:
        "Manage your account with ease. Link to your social media, email, and more.",
      status: "planned",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-sky-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "scheduled-links",
      title: "Scheduled Links",
      description: "Set links to activate and deactivate at specific times.",
      status: "planned",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-sky-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-slow absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-400/20 blur-[120px]"></div>
        <div className="animate-pulse-slow-delayed absolute -right-40 top-1/3 h-[600px] w-[600px] rounded-full bg-blue-700/15 blur-[120px]"></div>
        <div className="animate-pulse-slow absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <Nav user={myUser.data} />

      {/* Hero Section */}
      <section className="relative mx-auto mt-8 w-full max-w-7xl px-6 py-16 sm:mt-12 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-12">
          {/* Left side - Content */}
          <div className="flex flex-col justify-center">
            {/* Badge */}
            <div className="mb-6 inline-flex">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-1.5 text-sm font-medium text-sky-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
                </span>
                Now in Beta
              </span>
            </div>

            {/* Headline */}
            <h1 className="sora mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your links,{" "}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-sky-300 via-blue-400 to-blue-600 bg-clip-text text-transparent">
                  supercharged
                </span>
                <span className="absolute -inset-1 -z-10 block rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-600/20 blur-lg"></span>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-zinc-400">
              Create short, memorable links that look professional. Track
              engagement with powerful analytics. Perfect for social media,
              marketing campaigns, and personal branding.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
              {myUser.isPending ? (
                <button
                  disabled
                  className="group flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 text-lg font-semibold text-white opacity-70 shadow-lg shadow-sky-500/25"
                >
                  Loading...
                </button>
              ) : myUser.data?.user ? (
                <Link
                  href="/dashboard"
                  className="group flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 text-lg font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-500/30"
                >
                  Go to Dashboard
                  <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <button
                  onClick={() => void signIn()}
                  className="group flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 text-lg font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-sky-500/30"
                >
                  Get Started Free
                  <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
              <a
                href="#features"
                className="flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/30 px-6 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                Learn More
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <IconBolt className="h-4 w-4 text-sky-400" />
                Instant setup
              </div>
              <div className="flex items-center gap-2">
                <IconTarget className="h-4 w-4 text-blue-400" />
                Real-time analytics
              </div>
              <div className="flex items-center gap-2">
                <IconStars className="h-4 w-4 text-blue-600" />
                Free to start
              </div>
            </div>
          </div>

          {/* Right side - Hero Visual */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Main card */}
            <div className="relative w-full max-w-md">
              {/* Glow effect */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-sky-400/20 to-blue-600/20 blur-2xl"></div>

              {/* Card */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600">
                      <IconLink className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Link Dashboard</h3>
                      <p className="text-sm text-zinc-500">Manage your links</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                    Active
                  </span>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                    <div className="text-2xl font-bold text-white">2.4k</div>
                    <div className="text-xs text-zinc-500">Clicks</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                    <div className="text-2xl font-bold text-white">156</div>
                    <div className="text-xs text-zinc-500">Links</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                    <div className="text-2xl font-bold text-white">89%</div>
                    <div className="text-xs text-zinc-500">CTR</div>
                  </div>
                </div>

                {/* Link items */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 transition-colors hover:bg-zinc-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/10">
                      <IconLink className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">my-link/promo</div>
                      <div className="text-xs text-zinc-500">1.2k clicks this week</div>
                    </div>
                    <IconChartBar className="h-4 w-4 text-zinc-600" />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 transition-colors hover:bg-zinc-800/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <IconBookmark className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">my-link/blog</div>
                      <div className="text-xs text-zinc-500">856 clicks this week</div>
                    </div>
                    <IconChartBar className="h-4 w-4 text-zinc-600" />
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -right-6 top-8 animate-float rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-xs font-medium text-zinc-300">+127% traffic</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 animate-float-delayed rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <IconSparkles className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-medium text-zinc-300">New: Bookmarks!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent"></div>
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 backdrop-blur-sm transition-all hover:border-sky-400/30 hover:bg-zinc-900/80">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl transition-all group-hover:bg-sky-400/20"></div>
              <div className="relative">
                <div className="mb-2 text-5xl font-bold text-white">500+</div>
                <div className="text-zinc-400">Active users</div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:bg-zinc-900/80">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20"></div>
              <div className="relative">
                <div className="mb-2 text-5xl font-bold text-white">10k+</div>
                <div className="text-zinc-400">Links created</div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-8 backdrop-blur-sm transition-all hover:border-blue-700/30 hover:bg-zinc-900/80">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-700/10 blur-2xl transition-all group-hover:bg-blue-700/20"></div>
              <div className="relative">
                <div className="mb-2 text-5xl font-bold text-white">1M+</div>
                <div className="text-zinc-400">Monthly clicks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          {/* Section header */}
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm font-medium text-zinc-400 backdrop-blur-sm">
              Features
            </span>
            <h2 className="sora mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Everything you need
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Powerful tools to manage, track, and optimize your links
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-8 backdrop-blur-sm transition-all duration-300 hover:border-sky-400/50 hover:bg-zinc-900/60">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl transition-all duration-300 group-hover:bg-sky-400/20"></div>
              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-sky-500/10">
                  <IconLink className="h-6 w-6 text-sky-400" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  Custom Short Links
                </h3>
                <p className="mb-4 text-zinc-400">
                  Create branded, memorable links that are easy to share and remember.
                </p>
                <div className="flex items-center text-sm font-medium text-sky-400">
                  Learn more
                  <IconArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-8 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-zinc-900/60">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition-all duration-300 group-hover:bg-blue-500/20"></div>
              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                  <IconChartBar className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  Advanced Analytics
                </h3>
                <p className="mb-4 text-zinc-400">
                  Track clicks, geographic data, devices, and referrers in real-time.
                </p>
                <div className="flex items-center text-sm font-medium text-blue-400">
                  Learn more
                  <IconArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-8 backdrop-blur-sm transition-all duration-300 hover:border-blue-700/50 hover:bg-zinc-900/60">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-700/10 blur-3xl transition-all duration-300 group-hover:bg-blue-700/20"></div>
              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700/20 to-blue-800/10">
                  <IconBookmark className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  Bookmark Manager
                </h3>
                <p className="mb-4 text-zinc-400">
                  Organize and manage your links with tags, folders, and search.
                </p>
                <div className="flex items-center text-sm font-medium text-blue-500">
                  Learn more
                  <IconArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-500 to-blue-700"></div>
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            {/* Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

            <div className="relative px-8 py-16 sm:px-16 sm:py-20">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="sora mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                  Ready to supercharge your links?
                </h2>
                <p className="mb-8 text-lg text-sky-100">
                  Join thousands of users who are already creating better links
                  with our platform. Start for free today.
                </p>

                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  {myUser.isPending ? (
                    <button
                      disabled
                      className="flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-white/90 px-8 text-lg font-semibold text-blue-600 opacity-70"
                    >
                      Loading...
                    </button>
                  ) : myUser.data?.user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="group flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-white px-8 text-lg font-semibold text-blue-600 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                      >
                        Go to Dashboard
                        <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Link>
                      <Link
                        href="/bookmarks"
                        className="flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-transparent px-8 text-lg font-semibold text-white transition-all duration-300 hover:border-white/50 hover:bg-white/10"
                      >
                        My Bookmarks
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={() => void signIn()}
                      className="group flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-white px-8 text-lg font-semibold text-blue-600 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                    >
                      Create Free Account
                      <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>

                <p className="mt-6 text-sm text-sky-200">
                  No credit card required. Free forever for basic use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <ComingSoonSection features={roadmapFeatures} />

      <Footer />
    </main>
  );
}
