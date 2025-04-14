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

      folder ??= await db.bookmarkFolder.create({
        data: {
          name: "Root",
          userId,
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
        userId,
      },
    });

    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    await db.bookmark.delete({
      where: {
        id: input.bookmarkId,
        userId,
      },
    });

    return true;
  });

const createBookmark = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      url: z.string().url(),
      color: z.string(),
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
        color: input.color,
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
        userId,
      },
    });

    return true;
  });

const createFolder = protectedProcedure
  .input(
    z.object({ name: z.string(), color: z.string(), folderId: z.string() }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const parentFolder = await db.bookmarkFolder.findUnique({
      where: {
        id: input.folderId,
        userId,
      },
    });

    if (!parentFolder) {
      throw new Error("Parent folder not found");
    }

    const folder = await db.bookmarkFolder.create({
      data: {
        name: input.name,
        userId,
        parentFolderId: input.folderId,
        color: input.color,
      },
    });

    return folder;
  });

const moveItem = protectedProcedure
  .input(
    z.object({
      bookmarkIds: z.array(z.string()).optional(),
      folderIds: z.array(z.string()).optional(),
      targetFolderId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (!input.bookmarkIds && !input.folderIds) {
      throw new Error("No items to move");
    }

    const targetFolder = await db.bookmarkFolder.findUnique({
      where: {
        id: input.targetFolderId,
        userId,
      },
    });

    if (!targetFolder) {
      throw new Error("Target folder not found");
    }

    if (input.bookmarkIds) {
      await db.bookmark.updateMany({
        where: {
          id: {
            in: input.bookmarkIds,
          },
          userId,
        },
        data: {
          folderId: input.targetFolderId,
        },
      });
    }

    if (input.folderIds) {
      await db.bookmarkFolder.updateMany({
        where: {
          id: {
            in: input.folderIds,
          },
          userId,
        },
        data: {
          parentFolderId: input.targetFolderId,
        },
      });
    }

    return true;
  });

const editBookmark = protectedProcedure
  .input(
    z.object({
      bookmarkId: z.string(),
      newName: z.string(),
      newUrl: z.string().url(),
      newColor: z.string(),
      newFolderId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new Error("Not authenticated");
    }

    const bookmark = await db.bookmark.findUnique({
      where: {
        id: input.bookmarkId,
        userId,
      },
    });

    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    // if (badWords.some((word) => input.name.includes(word))) {
    //   throw new Error("Name contains bad words");
    // }

    // if (badWords.some((word) => input.url.includes(word))) {
    //   throw new Error("URL contains bad words");
    // }

    await db.bookmark.update({
      where: {
        id: input.bookmarkId,
      },
      data: {
        name: input.newName,
        url: input.newUrl,
        color: input.newColor,
        folderId: input.newFolderId,
      },
    });

    return true;
  });

const editFolder = protectedProcedure
  .input(
    z.object({
      folderId: z.string(),
      newName: z.string(),
      newColor: z.string(),
      newFolderId: z.string(),
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

    await db.bookmarkFolder.update({
      where: {
        id: input.folderId,
      },
      data: {
        name: input.newName,
        color: input.newColor,
        parentFolderId: input.newFolderId,
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
  createFolder,
  moveItem,
  editBookmark,
  editFolder,
});
