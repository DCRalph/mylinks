import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protocolFor } from "~/lib/domains";
import { domainHostSchema } from "~/lib/validation";
import { createTRPCRouter, permissionProcedure } from "~/server/api/trpc";
import { audit } from "~/server/audit";
import { googleEnabled } from "~/server/auth";
import { db } from "~/server/db";
import { checkDomain, invalidateDomains } from "~/server/domains";
import { runHousekeeping } from "~/server/housekeeping";
import {
  getSettings,
  saveSettings,
  settingsSchema,
  type PlatformSettings,
} from "~/server/settings";

// Admin → Domains and Admin → Settings. Every change is audited.

const domainProcedure = permissionProcedure({ domain: ["manage"] });
const settingsProcedure = permissionProcedure({ platform: ["manage"] });

const byId = z.object({ id: z.string() });

async function findDomain(id: string) {
  const domain = await db.domain.findUnique({ where: { id } });
  if (!domain) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
  }
  return domain;
}

const notPrimary = (domain: { primary: boolean }) => {
  if (domain.primary) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Make another domain primary first",
    });
  }
};

/** Lowercased, trimmed, without blanks or repeats. */
const cleanList = (items: string[]) => [
  ...new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean)),
];

const SETTING_LABELS: Record<keyof PlatformSettings, string> = {
  signUps: "sign-ups",
  reservedSlugs: "reserved slugs",
  blockedUrls: "blocked destinations",
  clickRetentionDays: "click history",
  ipAddresses: "IP addresses",
  limits: "creation limits",
};

export const platformRouter = createTRPCRouter({
  domains: domainProcedure.query(async () => ({
    domains: await db.domain.findMany({
      orderBy: [{ primary: "desc" }, { status: "asc" }, { createdAt: "asc" }],
    }),
    googleEnabled,
  })),

  addDomain: domainProcedure
    .input(z.object({ host: domainHostSchema }))
    .mutation(async ({ input, ctx }) => {
      const existing = await db.domain.findUnique({
        where: { host: input.host },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${input.host} is already added`,
        });
      }
      const domain = await db.domain.create({
        data: { host: input.host, protocol: protocolFor(input.host) },
      });
      invalidateDomains();
      await audit({
        actorId: ctx.session.user.id,
        action: "domain.add",
        target: { type: "domain", id: domain.id },
        summary: `Added ${domain.host}`,
      });
      return domain;
    }),

  /** Checks the domain reaches this site. Success activates a pending or disabled domain. */
  verifyDomain: domainProcedure.input(byId).mutation(async ({ input, ctx }) => {
    const domain = await findDomain(input.id);
    const error = await checkDomain(domain.host, domain.protocol);
    const activates = !error && domain.status !== "active";

    await db.domain.update({
      where: { id: domain.id },
      data: {
        checkedAt: new Date(),
        checkError: error,
        ...(activates && { status: "active", verifiedAt: new Date() }),
      },
    });
    if (activates) {
      invalidateDomains();
      await audit({
        actorId: ctx.session.user.id,
        action: "domain.verify",
        target: { type: "domain", id: domain.id },
        summary: `Verified and turned on ${domain.host}`,
      });
    }
    return { error };
  }),

  setPrimaryDomain: domainProcedure
    .input(byId)
    .mutation(async ({ input, ctx }) => {
      const domain = await findDomain(input.id);
      if (domain.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only an active domain can be primary",
        });
      }
      await db.$transaction([
        db.domain.updateMany({ data: { primary: false } }),
        db.domain.update({ where: { id: domain.id }, data: { primary: true } }),
      ]);
      invalidateDomains();
      await audit({
        actorId: ctx.session.user.id,
        action: "domain.primary",
        target: { type: "domain", id: domain.id },
        summary: `Made ${domain.host} the primary domain`,
      });
    }),

  disableDomain: domainProcedure
    .input(byId)
    .mutation(async ({ input, ctx }) => {
      const domain = await findDomain(input.id);
      notPrimary(domain);
      await db.domain.update({
        where: { id: domain.id },
        data: { status: "disabled" },
      });
      invalidateDomains();
      await audit({
        actorId: ctx.session.user.id,
        action: "domain.disable",
        target: { type: "domain", id: domain.id },
        summary: `Turned off ${domain.host}`,
      });
    }),

  removeDomain: domainProcedure.input(byId).mutation(async ({ input, ctx }) => {
    const domain = await findDomain(input.id);
    notPrimary(domain);
    await db.domain.delete({ where: { id: domain.id } });
    invalidateDomains();
    await audit({
      actorId: ctx.session.user.id,
      action: "domain.remove",
      target: { type: "domain", id: domain.id },
      summary: `Removed ${domain.host}`,
    });
  }),

  settings: settingsProcedure.query(() => getSettings()),

  saveSettings: settingsProcedure
    .input(settingsSchema)
    .mutation(async ({ input, ctx }) => {
      const before = await getSettings();
      const saved = await saveSettings({
        ...input,
        reservedSlugs: cleanList(input.reservedSlugs),
        blockedUrls: cleanList(input.blockedUrls),
      });

      const changed = (
        Object.keys(SETTING_LABELS) as (keyof PlatformSettings)[]
      ).filter(
        (key) => JSON.stringify(before[key]) !== JSON.stringify(saved[key]),
      );
      if (changed.length > 0) {
        await audit({
          actorId: ctx.session.user.id,
          action: "settings.update",
          summary: `Changed ${changed.map((key) => SETTING_LABELS[key]).join(", ")}`,
          details: { before, after: saved },
        });
      }
      // Apply a shorter retention or IP setting now rather than at the next daily run.
      if (
        changed.includes("clickRetentionDays") ||
        changed.includes("ipAddresses")
      ) {
        void runHousekeeping().catch(console.error);
      }
      return saved;
    }),
});
