import { z } from "zod";
import { db } from "~/server/db";
// get db type
import type { PrismaClient } from "@prisma/client";

// import badWords from "~/utils/badWords";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

async function fetchFolderWithSubfolders(
  folderId: string,
  userId: string,
  db: PrismaClient,
  includeBookmarks = true,
) {
  const folder = await db.bookmarkFolder.findUnique({
    where: { id: folderId, userId: userId },
    include: {
      bookmarks: includeBookmarks,
      subfolders: {
        include: {
          bookmarks: true,
        },
      },
    },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (folder.subfolders.length > 0) {
    const subfolders = await Promise.all(
      folder.subfolders.map((subfolder) =>
        fetchFolderWithSubfolders(subfolder.id, userId, db),
      ),
    );

    folder.subfolders = subfolders;
  }

  return folder;
}

// Initial query for the root folder:
const _getRootFolder = async (userId: string, db: PrismaClient) => {
  const folder = await db.bookmarkFolder.findFirst({
    where: {
      userId,
      parentFolderId: null,
    },
  });

  if (!folder) {
    throw new Error("Root folder not found");
  }

  return folder;
};

const getAllBookmarks = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const root = await _getRootFolder(userId, db);

  if (!root) {
    throw new Error("Root folder not found");
  }

  const bookmarks = await fetchFolderWithSubfolders(root.id, userId, db);

  return bookmarks;
});

const getFolder = protectedProcedure
  .input(z.object({ folderId: z.string().nullable() }))
  .query(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let folder;

    if (!input.folderId) {
      folder = await db.bookmarkFolder.findFirst({
        where: {
          userId,
          parentFolderId: null,
        },
        include: {
          bookmarks: true,
          subfolders: true,
        },
      });

      if (!folder) {
        folder = await db.bookmarkFolder.create({
          data: {
            name: "Root",
            userId,
          },
          include: {
            bookmarks: true,
            subfolders: true,
          },
        });
      }


    } else {
      folder = await db.bookmarkFolder.findUnique({
        where: {
          id: input.folderId,
          userId,
        },
        include: {
          bookmarks: true,
          subfolders: true,
        },
      });
    }

    if (!folder) {
      throw new Error("Folder not found");
    }

    return folder;
  });

const deleteBookmark = protectedProcedure
  .input(z.object({ bookmarkId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const bookmark = await db.bookmark.findFirst({
      where: {
        id: input.bookmarkId,
      },
    });

    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    await db.bookmark.delete({
      where: {
        id: input.bookmarkId,
      },
    });

    return true;
  });

const createBookmark = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      url: z.string().url(),
      folderId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const folder = await db.bookmarkFolder.findUnique({
      where: {
        id: input.folderId,
        userId,
      },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    // if (badWords.some((word) => input.name.includes(word))) {
    //   throw new Error("Name contains bad words");
    // }

    // if (badWords.some((word) => input.url.includes(word))) {
    //   throw new Error("URL contains bad words");
    // }

    const bookmark = await db.bookmark.create({
      data: {
        userId: userId,
        name: input.name,
        url: input.url,
        folderId: input.folderId,
      },
    });

    return bookmark;
  });

  const deleteFolder = protectedProcedure
  .input(z.object({ folderId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const folder = await db.bookmarkFolder.findUnique({
      where: {
        id: input.folderId,
        userId,
      },
    });

    if (!folder) {
      throw new Error("Folder not found");
    }

    await db.bookmarkFolder.delete({
      where: {
        id: input.folderId,
      },
    });

    return true;
  });

export const bookmakrsRouter = createTRPCRouter({
  getAllBookmarks,
  getFolder,
  deleteBookmark,
  createBookmark,
  deleteFolder,
});
