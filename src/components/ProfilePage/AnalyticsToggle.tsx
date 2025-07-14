"use client";

import { useState } from "react";
import { IconChartBar } from "@tabler/icons-react";
import ProfileAnalytics from "./ProfileAnalytics";
import { useSession } from "next-auth/react";
import { type Profile } from "@prisma/client";

export default function AnalyticsToggle({ profile }: { profile: Profile }) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { data: session } = useSession();

  const isOwner = session?.user?.id === profile.userId;

  if (!isOwner) {
    return null;
  }

  return (
    <>
      {/* Fixed Analytics Toggle Button */}
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

      {/* Analytics Section - Separate Card */}
      {showAnalytics && (
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8">
          <ProfileAnalytics profileId={profile.id} />
        </div>
      )}
    </>
  );
} 