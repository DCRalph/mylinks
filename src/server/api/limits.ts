import { TRPCError } from "@trpc/server";

import { plural } from "~/lib/format";
import { can } from "~/lib/permissions";
import { db } from "~/server/db";
import { getSettings } from "~/server/settings";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Per-account creation limits from Admin → Settings. Counts what the user
 * created in the window; roles with platform:unlimited are exempt.
 */
export async function assertWithinLimit(
  kind: "link" | "profile" | "pixel",
  user: { id: string; role?: string | null },
) {
  if (can(user, { platform: ["unlimited"] })) return;
  const { limits } = await getSettings();

  const since = (ms: number) => ({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - ms) } },
  });
  const [limit, windowMs, recent] =
    kind === "link"
      ? [limits.linksPerHour, HOUR_MS, await db.link.count(since(HOUR_MS))]
      : kind === "profile"
        ? [limits.profilesPerDay, DAY_MS, await db.profile.count(since(DAY_MS))]
        : [limits.pixelsPerDay, DAY_MS, await db.spyPixel.count(since(DAY_MS))];

  if (recent >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `You can create ${plural(limit, kind)} ${windowMs === HOUR_MS ? "an hour" : "a day"}. Try again later.`,
    });
  }
}
