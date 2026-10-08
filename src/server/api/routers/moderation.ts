import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "~/generated/prisma/client";
import { createTRPCRouter, permissionProcedure } from "~/server/api/trpc";
import { humanClicks, withBots } from "~/server/analytics";
import { audit, describeUser } from "~/server/audit";
import { db } from "~/server/db";

// Admin → Links and Admin → Profiles. Turned-off links and profiles show
// visitors a "turned off" page; owners see the reason. Every action is audited.

/** Reason given to content turned off along with a ban, so unbanning can restore it. */
const BANNED = "Account banned";

const linkProcedure = permissionProcedure({ link: ["moderate"] });
const profileProcedure = permissionProcedure({ profile: ["moderate"] });

const listInput = z.object({
  search: z.string().trim().max(100).default(""),
  filter: z.enum(["all", "off"]).default("all"),
  sort: z.enum(["newest", "top"]).default("newest"),
});

const toggleInput = z.object({
  id: z.string(),
  /** A reason turns it off; null turns it back on. */
  reason: z.string().trim().min(1).max(200).nullable(),
});

const owner = { select: { id: true, name: true, email: true, username: true } };

const ownerMatches = (search: string): Prisma.UserWhereInput => ({
  OR: [
    { name: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
    { username: { contains: search, mode: "insensitive" } },
  ],
});

const notFound = (what: string) =>
  new TRPCError({ code: "NOT_FOUND", message: `${what} not found` });

export const moderationRouter = createTRPCRouter({
  /** Every link, searchable by slug, URL, name or owner. Top sorts by all clicks. */
  links: linkProcedure.input(listInput).query(async ({ input }) => {
    const links = await db.link.findMany({
      where: {
        ...(input.filter === "off" && { disabledAt: { not: null } }),
        ...(input.search && {
          OR: [
            { slug: { contains: input.search, mode: "insensitive" } },
            { url: { contains: input.search, mode: "insensitive" } },
            { name: { contains: input.search, mode: "insensitive" } },
            { user: ownerMatches(input.search) },
          ],
        }),
      },
      include: { user: owner, _count: { select: humanClicks } },
      orderBy:
        input.sort === "top"
          ? { clicks: { _count: "desc" } }
          : { createdAt: "desc" },
      take: 100,
    });
    return withBots("linkId", links);
  }),

  profiles: profileProcedure.input(listInput).query(async ({ input }) => {
    const profiles = await db.profile.findMany({
      where: {
        ...(input.filter === "off" && { disabledAt: { not: null } }),
        ...(input.search && {
          OR: [
            { slug: { contains: input.search, mode: "insensitive" } },
            { name: { contains: input.search, mode: "insensitive" } },
            { user: ownerMatches(input.search) },
          ],
        }),
      },
      include: {
        user: owner,
        _count: { select: { ...humanClicks, profileLinks: true } },
      },
      orderBy:
        input.sort === "top"
          ? { clicks: { _count: "desc" } }
          : { createdAt: "desc" },
      take: 100,
    });
    return withBots("profileId", profiles);
  }),

  setLinkDisabled: linkProcedure
    .input(toggleInput)
    .mutation(async ({ input, ctx }) => {
      const link = await db.link.findUnique({ where: { id: input.id } });
      if (!link) throw notFound("Link");
      await db.link.update({
        where: { id: link.id },
        data: {
          disabledAt: input.reason ? new Date() : null,
          disabledReason: input.reason,
        },
      });
      await audit({
        actorId: ctx.session.user.id,
        action: input.reason ? "link.disable" : "link.enable",
        target: { type: "link", id: link.id },
        summary: input.reason
          ? `Turned off /${link.slug}: ${input.reason}`
          : `Turned /${link.slug} back on`,
      });
    }),

  setProfileDisabled: profileProcedure
    .input(toggleInput)
    .mutation(async ({ input, ctx }) => {
      const profile = await db.profile.findUnique({ where: { id: input.id } });
      if (!profile) throw notFound("Profile");
      await db.profile.update({
        where: { id: profile.id },
        data: {
          disabledAt: input.reason ? new Date() : null,
          disabledReason: input.reason,
        },
      });
      await audit({
        actorId: ctx.session.user.id,
        action: input.reason ? "profile.disable" : "profile.enable",
        target: { type: "profile", id: profile.id },
        summary: input.reason
          ? `Turned off profile /p/${profile.slug}: ${input.reason}`
          : `Turned profile /p/${profile.slug} back on`,
      });
    }),

  deleteLink: linkProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const link = await db.link.findUnique({ where: { id: input.id } });
      if (!link) throw notFound("Link");
      await db.link.delete({ where: { id: link.id } });
      await audit({
        actorId: ctx.session.user.id,
        action: "link.delete",
        target: { type: "link", id: link.id },
        summary: `Deleted /${link.slug} (${link.url}) of ${await describeUser(link.userId)}`,
      });
    }),

  deleteProfile: profileProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const profile = await db.profile.findUnique({ where: { id: input.id } });
      if (!profile) throw notFound("Profile");
      await db.profile.delete({ where: { id: profile.id } });
      await audit({
        actorId: ctx.session.user.id,
        action: "profile.delete",
        target: { type: "profile", id: profile.id },
        summary: `Deleted profile /p/${profile.slug} of ${await describeUser(profile.userId)}`,
      });
    }),

  /** Turns off everything a user owns, as part of a ban. */
  disableUserContent: permissionProcedure({
    link: ["moderate"],
    profile: ["moderate"],
  })
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const where = { userId: input.userId, disabledAt: null };
      const data = { disabledAt: new Date(), disabledReason: BANNED };
      const [links, profiles] = await db.$transaction([
        db.link.updateMany({ where, data }),
        db.profile.updateMany({ where, data }),
      ]);
      await audit({
        actorId: ctx.session.user.id,
        action: "user.disable-content",
        target: { type: "user", id: input.userId },
        summary: `Turned off ${links.count} links and ${profiles.count} profiles of ${await describeUser(input.userId)}`,
      });
      return { links: links.count, profiles: profiles.count };
    }),

  /** Turns back on what disableUserContent turned off. Other reasons stay off. */
  restoreUserContent: permissionProcedure({
    link: ["moderate"],
    profile: ["moderate"],
  })
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const where = { userId: input.userId, disabledReason: BANNED };
      const data = { disabledAt: null, disabledReason: null };
      const [links, profiles] = await db.$transaction([
        db.link.updateMany({ where, data }),
        db.profile.updateMany({ where, data }),
      ]);
      if (links.count + profiles.count > 0) {
        await audit({
          actorId: ctx.session.user.id,
          action: "user.restore-content",
          target: { type: "user", id: input.userId },
          summary: `Turned ${links.count} links and ${profiles.count} profiles of ${await describeUser(input.userId)} back on`,
        });
      }
      return { links: links.count, profiles: profiles.count };
    }),
});
