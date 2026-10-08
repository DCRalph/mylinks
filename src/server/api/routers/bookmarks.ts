import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "~/server/db";
import type { Bookmark, BookmarkFolder } from "~/generated/prisma/client";

import { httpUrlSchema } from "~/lib/validation";

const nameSchema = z.string().trim().min(1, "Name is required").max(60);

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

type FolderTree = BookmarkFolder & {
  bookmarks: Bookmark[];
  subfolders: FolderTree[];
};

/** All of a user's folders and bookmarks as one tree, from two queries. */
async function getFolderTree(userId: string): Promise<FolderTree> {
  const [folders, bookmarks] = await Promise.all([
    db.bookmarkFolder.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    db.bookmark.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  const nodes = new Map<string, FolderTree>(
    folders.map((folder) => [
      folder.id,
      { ...folder, bookmarks: [], subfolders: [] },
    ]),
  );
  for (const bookmark of bookmarks) {
    nodes.get(bookmark.folderId)?.bookmarks.push(bookmark);
  }

  let root: FolderTree | undefined;
  for (const node of nodes.values()) {
    if (node.parentFolderId) nodes.get(node.parentFolderId)?.subfolders.push(node);
    else root ??= node;
  }

  if (!root) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No bookmarks yet" });
  }
  return root;
}

const getAllBookmarks = protectedProcedure.query(({ ctx }) =>
  getFolderTree(ctx.session.user.id),
);

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
          subfolders: {
            include: {
              _count: {
                select: {
                  bookmarks: true,
                  subfolders: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookmarks: true,
              subfolders: true,
            },
          },
        },
      });

      folder ??= await db.bookmarkFolder.create({
        data: {
          name: "Root",
          userId,
          color: "#3b82f6",
        },
        include: {
          bookmarks: true,
          subfolders: {
            include: {
              _count: {
                select: {
                  bookmarks: true,
                  subfolders: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookmarks: true,
              subfolders: true,
            },
          },
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
          subfolders: {
            include: {
              _count: {
                select: {
                  bookmarks: true,
                  subfolders: true,
                },
              },
            },
          },
          parentFolder: true,
          _count: {
            select: {
              bookmarks: true,
              subfolders: true,
            },
          },
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
      name: nameSchema,
      url: httpUrlSchema,
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
    z.object({ name: nameSchema, color: z.string(), folderId: z.string() }),
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

/** Throws if putting `folderIds` under `targetId` would nest a folder inside itself. */
async function assertNotIntoOwnSubtree(
  folderIds: string[],
  targetId: string,
  userId: string,
) {
  let current: string | null = targetId;
  while (current) {
    if (folderIds.includes(current)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A folder can't be moved inside itself",
      });
    }
    const folder: { parentFolderId: string | null } | null =
      await db.bookmarkFolder.findUnique({
        where: { id: current, userId },
        select: { parentFolderId: true },
      });
    current = folder?.parentFolderId ?? null;
  }
}

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
      await assertNotIntoOwnSubtree(
        input.folderIds,
        input.targetFolderId,
        userId,
      );

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
      newName: nameSchema,
      newUrl: httpUrlSchema,
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
      newName: nameSchema,
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

    if (input.newFolderId !== folder.parentFolderId) {
      const target = await db.bookmarkFolder.findUnique({
        where: { id: input.newFolderId, userId },
      });
      if (!target) {
        throw new Error("Target folder not found");
      }
      await assertNotIntoOwnSubtree(
        [input.folderId],
        input.newFolderId,
        userId,
      );
    }

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

const getFolderPath = protectedProcedure
  .input(z.object({ folderId: z.string().nullable() }))
  .query(async ({ input, ctx }) => {
    const userId = ctx.session?.user.id;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const path: { id: string; name: string }[] = [];
    let currentFolderId = input.folderId;

    // Loop until we reach the root folder (parentFolderId is null)
    while (currentFolderId) {
      const folder = await db.bookmarkFolder.findUnique({
        where: {
          id: currentFolderId,
          userId,
        },
        select: {
          id: true,
          name: true,
          parentFolderId: true,
          parentFolder: {
            select: {
              id: true,
              name: true,
              parentFolderId: true,
            },
          },
        },
      });

      if (!folder) break;

      // Add the current folder to the beginning of the path array
      path.unshift({ id: folder.id, name: folder.name });

      if (
        folder.parentFolderId === null // root folder
      ) {
        break;
      }

      // Move to the parent folder
      currentFolderId = folder.parentFolderId;
    }

    // REMOVE ROOT FOLDER
    path.shift();

    // Add root folder
    path.unshift({ id: "", name: "Bookmarks" });

    return path;
  });

// Admin procedure to create sample bookmarks and folders
const createSampleBookmarks = adminProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  // Get or create root folder
  let rootFolder = await db.bookmarkFolder.findFirst({
    where: {
      userId,
      parentFolderId: null,
    },
  });

  rootFolder ??= await db.bookmarkFolder.create({
    data: {
      name: "Root",
      userId,
      color: "#3b82f6",
    },
  });

  const exampleFolder = await db.bookmarkFolder.create({
    data: {
      name: "Example Folder",
      userId,
      color: "#3b82f6",
      parentFolderId: rootFolder.id,
    },
  });

  // Create sample folders
  const folders = [
    {
      name: "Work Resources",
      color: "#ef4444", // red
      bookmarks: [
        {
          name: "Google Workspace",
          url: "https://workspace.google.com/",
          color: "#ef4444",
        },
        {
          name: "Microsoft Office 365",
          url: "https://www.office.com/",
          color: "#ef4444",
        },
        {
          name: "Notion Workspace",
          url: "https://www.notion.so/",
          color: "#ef4444",
        },
      ],
    },
    {
      name: "Learning",
      color: "#8b5cf6", // purple
      bookmarks: [
        {
          name: "Coursera",
          url: "https://www.coursera.org/",
          color: "#8b5cf6",
        },
        {
          name: "Udemy Courses",
          url: "https://www.udemy.com/",
          color: "#8b5cf6",
        },
        {
          name: "MDN Web Docs",
          url: "https://developer.mozilla.org/",
          color: "#8b5cf6",
        },
      ],
    },
    {
      name: "Entertainment",
      color: "#f59e0b", // amber
      bookmarks: [
        {
          name: "Netflix",
          url: "https://www.netflix.com/",
          color: "#f59e0b",
        },
        {
          name: "YouTube",
          url: "https://www.youtube.com/",
          color: "#f59e0b",
        },
        {
          name: "Spotify",
          url: "https://open.spotify.com/",
          color: "#f59e0b",
        },
        {
          name: "Twitch",
          url: "https://www.twitch.tv/",
          color: "#f59e0b",
        },
      ],
    },
  ];

  // Create the folders and their bookmarks
  for (const folderData of folders) {
    const folder = await db.bookmarkFolder.create({
      data: {
        name: folderData.name,
        color: folderData.color,
        userId,
        parentFolderId: exampleFolder.id,
      },
    });

    for (const bookmarkData of folderData.bookmarks) {
      await db.bookmark.create({
        data: {
          name: bookmarkData.name,
          url: bookmarkData.url,
          color: bookmarkData.color,
          userId,
          folderId: folder.id,
        },
      });
    }
  }

  // Create direct bookmarks in root folder
  const rootBookmarks = [
    {
      name: "GitHub",
      url: "https://github.com/",
      color: "#3b82f6", // blue
    },
    {
      name: "Stack Overflow",
      url: "https://stackoverflow.com/",
      color: "#f97316", // orange
    },
    {
      name: "Google",
      url: "https://www.google.com/",
      color: "#22c55e", // green
    },
    {
      name: "ChatGPT",
      url: "https://chat.openai.com/",
      color: "#10b981", // emerald
    },
  ];

  for (const bookmarkData of rootBookmarks) {
    await db.bookmark.create({
      data: {
        name: bookmarkData.name,
        url: bookmarkData.url,
        color: bookmarkData.color,
        userId,
        folderId: exampleFolder.id,
      },
    });
  }

  return { success: true };
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
  getFolderPath,
  createSampleBookmarks,
});
