import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { setupRouter } from "./routers/setup";
import { linkRouter } from "./routers/link";
import { profileRouter } from "./routers/profile";
import { adminRouter } from "./routers/admin";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  setup: setupRouter,
  link: linkRouter,
  profile: profileRouter,
  admin: adminRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
