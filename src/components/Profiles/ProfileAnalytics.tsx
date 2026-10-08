"use client";

import { useState } from "react";

import ClickAnalytics, { type Range } from "~/components/ClickAnalytics";
import { api } from "~/trpc/react";

/** Views over time and where they came from, for one profile. */
export default function ProfileAnalytics({ profileId }: { profileId: string }) {
  const [days, setDays] = useState<Range>(7);
  const analytics = api.profile.getAnalytics.useQuery({ profileId, days });

  return (
    <ClickAnalytics
      noun="views"
      days={days}
      onDaysChange={setDays}
      data={analytics.data}
    />
  );
}
