"use client";

import Head from "next/head";
import React, { use } from "react";
import { IconError404, IconLink } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import ProfilePage from "~/components/ProfilePage/ProfilePage";

export default function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const {
    data: profile,
    isLoading,
    error,
  } = api.profile.getPublicProfile.useQuery(
    { slug },
    {
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  if (isLoading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        {/* Decorative Elements */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
          <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-6 text-center">
          <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="relative flex flex-col items-center">
              <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-2 border-b-blue-500 border-l-blue-500 border-r-transparent border-t-transparent"></div>
              <p className="mt-6 text-lg text-zinc-300">Loading profile...</p>
            </div>
          </div>
        </div>

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

  if (error || !profile) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Head>
          <title>link2it | Not Found</title>
          <meta name="description" content="Link sharing website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Decorative Elements */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl"></div>
          <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl"></div>
          <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md px-6 text-center">
          <div className="relative mb-8 flex justify-center">
            <div className="rounded-full bg-white/5 p-5 backdrop-blur-md">
              <IconError404 className="h-16 w-16 text-red-400" />
            </div>
          </div>

          <div className="glass-card relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <h1 className="sora mb-4 text-3xl font-bold tracking-tight text-white">
              Profile Not Found
            </h1>
            <p className="text-zinc-300">
              The profile{" "}
              <span className="font-medium text-white">&quot;{slug}&quot;</span>{" "}
              doesn&apos;t exist or has been removed.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <ProfilePage profile={profile} />;
}
