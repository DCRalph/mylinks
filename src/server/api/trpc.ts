import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { can, type Permissions } from "~/lib/permissions";
import { getAuth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Per-request context for every procedure. Built from the incoming headers by
 * the HTTP handler (src/app/api/trpc) and by the RSC caller (src/trpc/server).
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await (
    await getAuth()
  ).api.getSession({
    headers: opts.headers,
  });

  return {
    db,
    session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const zodError = error.cause instanceof ZodError ? error.cause : null;
    return {
      ...shape,
      // Show the first validation problem instead of the serialized issue list.
      message: zodError?.issues[0]?.message ?? shape.message,
      data: {
        ...shape.data,
        zodError: zodError ? z.flattenError(zodError) : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  if (t._config.isDev) {
    console.log(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  }
  return result;
});

/** Anyone, signed in or not. `ctx.session` may be null. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/** Signed-in users only. `ctx.session` is non-null. */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { session: ctx.session } });
  });

/**
 * Signed-in users whose roles grant `permissions` (see src/lib/permissions.ts).
 * With `any`, one of the listed permissions is enough.
 */
export const permissionProcedure = (
  permissions: Permissions,
  options?: { any?: boolean },
) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!can(ctx.session.user, permissions, options)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });
