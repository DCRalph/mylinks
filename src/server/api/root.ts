import { userRouter } from "./routers/user";
import { slugRouter } from "./routers/slug";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  slug: slugRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
