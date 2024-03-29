import { z } from "zod";
import { db } from "~/server/db";

import badWords from "~/utils/badWords";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { randomUUID } from "crypto";

export const linkRouter = createTRPCRouter({
  getLongUrl: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const { slug } = input;
      const url = await db.link.findUnique({
        where: {
          slug,
        },
      });

      if (!url) {
        return {
          error: "Link not found",
        };
      }

      return {
        url: url.url,
      };

    }),
  getMyLinks: protectedProcedure
    .query(async ({ ctx }) => {

      // console.log("link here", ctx.session?.user)

      const links = await db.link.findMany({
        where: {
          userId: ctx.session?.user.id,
        },
      });

      return {
        links,
      };
    }),
  createLink: protectedProcedure
    .input(z.object({ name: z.string(), url: z.string(), slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { name, url } = input;
      let { slug } = input;

      if (name.length < 3) {
        throw new Error('Name must be at least 3 characters long');
      }

      if (name.length > 20) {
        throw new Error('Name must be at most 20 characters long');
      }

      if (slug.length > 0) {

        if (slug.length < 3) {
          throw new Error('Slug must be at least 3 characters long');
        }

        if (slug.length > 20) {
          throw new Error('Slug must be at most 20 characters long');
        }

        if (!/^[a-zA-Z0-9_]*$/.test(slug)) {
          throw new Error('Slug can only contain letters, numbers and underscores');
        }

        const lowerSlug = slug.toLowerCase()
        const indexInBadSlugs = badWords.badSlugs.indexOf(lowerSlug);

        if (indexInBadSlugs !== -1) {
          throw new Error(`Slug cannot be "${badWords.badSlugs[indexInBadSlugs]}" you cheaky barstard`);
        }
      } else {
        slug = randomUUID().slice(0, 8)
      }

      const urlExists = await db.link.findUnique({
        where: {
          slug,
        },
      });

      if (urlExists) {
        throw new Error('Slug already exists');
      }

      const indexInBadUrlFilter = badWords.badUrlFilter.findIndex((badWord) => url.includes(badWord));

      if (indexInBadUrlFilter !== -1) {
        throw new Error(`URL cannot contain "${badWords.badUrlFilter[indexInBadUrlFilter]}"`);
      }

      try {
        new URL(url);
      } catch (error) {
        throw new Error('Invalid URL');
      }


      const newLink = await db.link.create({
        data: {
          name,
          url,
          slug,
          userId: ctx.session?.user.id,
        },
      });

      return {
        link: newLink,
      };
    }),
  editLink: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string(), url: z.string(), slug: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id, name, url } = input;
      let { slug } = input;

      if (name.length < 3) {
        throw new Error('Name must be at least 3 characters long');
      }

      if (name.length > 20) {
        throw new Error('Name must be at most 20 characters long');
      }

      if (slug.length > 0) {

        if (slug.length < 3) {
          throw new Error('Slug must be at least 3 characters long');
        }

        if (slug.length > 20) {
          throw new Error('Slug must be at most 20 characters long');
        }

        if (!/^[a-zA-Z0-9_]*$/.test(slug)) {
          throw new Error('Slug can only contain letters, numbers and underscores');
        }

        const lowerSlug = slug.toLowerCase()
        const indexInBadSlugs = badWords.badSlugs.indexOf(lowerSlug);

        if (indexInBadSlugs !== -1) {
          throw new Error(`Slug cannot be "${badWords.badSlugs[indexInBadSlugs]}" you cheaky barstard`);
        }
      } else {
        slug = randomUUID().slice(0, 8)
      }

      const urlExists = await db.link.findUnique({
        where: {
          slug,
          AND: {
            NOT: {
              id,
            },
          },
        },
      });

      if (urlExists) {
        throw new Error('Slug already exists');
      }

      const indexInBadUrlFilter = badWords.badUrlFilter.findIndex((badWord) => url.includes(badWord));

      if (indexInBadUrlFilter !== -1) {
        throw new Error(`URL cannot contain "${badWords.badUrlFilter[indexInBadUrlFilter]}"`);
      }

      try {
        new URL(url);
      } catch (error) {
        throw new Error('Invalid URL');
      }

      const updatedLink = await db.link.update({
        where: {
          id,
        },
        data: {
          name,
          url,
          slug,
        },
      });

      return {
        link: updatedLink,
      };
    }),
  deleteLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      await db.link.delete({
        where: {
          id,
        },
      });

      return {
        success: true,
      };
    }),
});
