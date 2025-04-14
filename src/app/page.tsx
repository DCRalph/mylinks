"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  IconBrandGithub,
  IconChevronRight,
  IconExternalLink,
  IconLink,
  IconRocket,
  IconSparkles,
} from "@tabler/icons-react";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import { api } from "~/trpc/react";
import ComingSoonSection, {
  type RoadmapFeature,
} from "~/components/ComingSoonSection";

export default function Home() {
  const myUser = api.user.getUser.useQuery();

  // Define the roadmap features
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
      description: "Manage your account with ease. Link to your social media, email, and more.",
      status: "planned",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-purple-400"
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
          className="h-5 w-5 text-purple-400"
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
    <main className="flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900">
      <Nav user={myUser.data} />

      {/* Hero Section */}
      <section className="relative mx-auto mt-12 w-full max-w-7xl px-6 py-16 sm:mt-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>

        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">
              <IconSparkles className="mr-1 h-4 w-4" /> Now in Beta
            </span>
            <h1 className="sora mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Supercharge your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                links
              </span>
            </h1>
            <p className="mb-8 text-lg text-zinc-400">
              Create short, memorable links that look professional and track
              engagement with powerful analytics. Perfect for social media,
              marketing campaigns, and personal branding.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              {myUser.isPending ? (
                <button
                  disabled
                  className="h-12 min-w-[180px] cursor-not-allowed rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-lg font-medium text-white opacity-70 shadow-lg shadow-blue-500/20"
                >
                  Loading...
                </button>
              ) : myUser.data?.user ? (
                <Link
                  href="/dashboard"
                  className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-lg font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                >
                  Get Started <IconChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  onClick={() => void signIn()}
                  className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-lg font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                >
                  Sign In to Start <IconChevronRight className="ml-1 h-4 w-4" />
                </button>
              )}
              <Link
                href="#features"
                className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-5 py-3 text-lg font-medium text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:bg-zinc-700/50 hover:shadow-lg active:translate-y-[1px]"
              >
                See Features
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              {/* Placeholder for hero screenshot */}
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <IconLink className="mb-4 h-12 w-12 text-blue-500" />
                <h3 className="text-xl font-medium text-white">
                  Dashboard Preview
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Beautiful analytics and link management
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
              <div className="flex h-full items-center justify-center p-4">
                <IconRocket className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full bg-zinc-900/60 py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-5xl font-bold text-white">500+</h3>
              <p className="text-zinc-400">Active users</p>
            </div>
            <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-5xl font-bold text-white">10k+</h3>
              <p className="text-zinc-400">Links created</p>
            </div>
            <div className="flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
              <h3 className="mb-2 text-5xl font-bold text-white">1M+</h3>
              <p className="text-zinc-400">Monthly clicks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12"
      >
        <div className="mb-12 text-center">
          <h2 className="sora mb-4 text-3xl font-bold text-white sm:text-4xl">
            Powerful Features
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Everything you need to manage, track, and optimize your links
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
            <div className="mb-4 w-fit rounded-full bg-blue-500/10 p-3">
              <IconLink className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Custom Short Links
            </h3>
            <p className="text-zinc-400">
              Create branded, memorable links that are easy to share and
              remember.
            </p>

            {/* Feature Screenshot Placeholder */}
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <p className="text-sm text-zinc-500">
                  Custom links interface screenshot
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
            <div className="mb-4 w-fit rounded-full bg-indigo-500/10 p-3">
              <IconExternalLink className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Advanced Analytics
            </h3>
            <p className="text-zinc-400">
              Track clicks, geographic data, devices, and referrers in
              real-time.
            </p>

            {/* Feature Screenshot Placeholder */}
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <p className="text-sm text-zinc-500">
                  Analytics dashboard screenshot
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
            <div className="mb-4 w-fit rounded-full bg-green-500/10 p-3">
              <IconBrandGithub className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Bookmark Manager
            </h3>
            <p className="text-zinc-400">
              Organize and manage your links with tags, folders, and search
              functionality.
            </p>

            {/* Feature Screenshot Placeholder */}
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <p className="text-sm text-zinc-500">
                  Bookmark manager screenshot
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-12">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative">
            <h2 className="sora mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mb-8 max-w-2xl text-lg text-blue-100">
              Join thousands of users who are already supercharging their links
              with our platform.
            </p>

            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              {myUser.isPending ? (
                <button
                  disabled
                  className="h-12 min-w-[180px] cursor-not-allowed rounded-lg bg-white/80 px-5 py-3 text-lg font-medium text-blue-600 opacity-70 shadow-lg"
                >
                  Loading...
                </button>
              ) : myUser.data?.user ? (
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link
                    href="/dashboard"
                    className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-lg font-medium text-blue-600 shadow-lg transition-all hover:translate-y-[-1px] hover:bg-blue-50 hover:shadow-xl active:translate-y-[1px]"
                  >
                    Go to Dashboard <IconChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/bookmarks"
                    className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-5 py-3 text-lg font-medium text-white shadow-lg transition-all hover:translate-y-[-1px] hover:bg-white/10 hover:shadow-xl active:translate-y-[1px]"
                  >
                    My Bookmarks <IconChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => void signIn()}
                  className="flex h-12 min-w-[180px] items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-lg font-medium text-blue-600 shadow-lg transition-all hover:translate-y-[-1px] hover:bg-blue-50 hover:shadow-xl active:translate-y-[1px]"
                >
                  Create an Account{" "}
                  <IconChevronRight className="ml-1 h-4 w-4" />
                </button>
              )}
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
