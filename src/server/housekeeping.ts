import "server-only";

import { z } from "zod";

import { IP_HEADERS, withoutIps } from "~/server/clicks";
import { db } from "~/server/db";
import { getSettings } from "~/server/settings";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIM_AFTER_DAYS = 30;

/**
 * Applies Admin → Settings to stored clicks: deletes those past the retention
 * window and trims or removes IP addresses. Runs daily, and after settings change.
 */
export async function runHousekeeping() {
  const { clickRetentionDays, ipAddresses } = await getSettings();

  if (clickRetentionDays > 0) {
    await db.click.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - clickRetentionDays * DAY_MS) },
      },
    });
  }

  if (ipAddresses === "full") return;
  const before =
    ipAddresses === "none"
      ? new Date()
      : new Date(Date.now() - TRIM_AFTER_DAYS * DAY_MS);

  if (ipAddresses === "none") {
    await db.click.updateMany({
      where: { createdAt: { lt: before }, ipAddress: { not: null } },
      data: { ipAddress: null },
    });
  } else {
    // 203.0.113.45 -> 203.0.113.0, 2001:db8:85a3:8d3::1 -> 2001:db8:85a3::
    await db.$executeRaw`
      UPDATE "Click" SET "ipAddress" = CASE
        WHEN "ipAddress" LIKE '%:%'
          THEN array_to_string((string_to_array("ipAddress", ':'))[1:3], ':') || '::'
        ELSE regexp_replace("ipAddress", '\\.[0-9]+$', '.0')
      END
      WHERE "createdAt" < ${before}
        AND "ipAddress" IS NOT NULL
        AND "ipAddress" NOT LIKE '%.0'
        AND "ipAddress" NOT LIKE '%::'`;
  }
  await stripHeaderIps(before);
}

/** Removes IP headers from pixel loads stored before `before`, in batches. */
async function stripHeaderIps(before: Date) {
  // Capped so a row that somehow keeps matching can't spin forever.
  for (let round = 0; round < 200; round++) {
    const batch = await db.click.findMany({
      where: {
        createdAt: { lt: before },
        OR: IP_HEADERS.map((name) => ({
          allHeaders: { contains: `"${name}"` },
        })),
      },
      select: { id: true, allHeaders: true },
      take: 500,
    });
    if (batch.length === 0) return;

    await db.$transaction(
      batch.map((click) =>
        db.click.update({
          where: { id: click.id },
          data: { allHeaders: stripped(click.allHeaders) },
        }),
      ),
    );
  }
}

const headerMap = z.record(z.string(), z.unknown());

function stripped(raw: string | null) {
  try {
    const parsed = headerMap.safeParse(JSON.parse(raw ?? "null"));
    if (!parsed.success) return null;
    const headers = Object.entries(parsed.data).map(
      ([name, value]) => [name, String(value)] as const,
    );
    return JSON.stringify(withoutIps(Object.fromEntries(headers)));
  } catch {
    return null;
  }
}

/** Starts the daily run. Called once at server start. */
export function scheduleHousekeeping() {
  const run = () => void runHousekeeping().catch(console.error);
  setTimeout(run, 60_000);
  setInterval(run, DAY_MS);
}
