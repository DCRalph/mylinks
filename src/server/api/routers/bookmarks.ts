import { z } from "zod";
import { db } from "~/server/db";
// get db type
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

import badWords from "~/utils/badWords";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

async function fetchFolderWithSubfolders(folderId: string, db: PrismaClient) {
  const folder = await db.bookmarkFolder.findUnique({
    where: { id: folderId },
    include: {
      bookmarks: true,
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
        fetchFolderWithSubfolders(subfolder.id, db),
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

  const bookmarks = await fetchFolderWithSubfolders(root.id, db);

  return bookmarks;
});

const getRootFolder = protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session?.user.id;
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const folder = await db.bookmarkFolder.findFirst({
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
    throw new Error("Root folder not found");
  }

  return folder;
});

const getFolder = protectedProcedure
  .input(z.object({ folderId: z.string() }))
  .query(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let folder;

    if (input.folderId === "root") {
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
    } else {
      folder = await db.bookmarkFolder.findUnique({
        where: {
          id: input.folderId,
        },
        include: {
          bookmarks: true,
          subfolders: true,
        },
      });
    }

    // todo check if user has access to this folder

    if (!folder) {
      throw new Error("Folder not found");
    }

    return folder;
  });

export const bookmakrsRouter = createTRPCRouter({
  getAllBookmarks,
  getRootFolder,
  getFolder,
});
