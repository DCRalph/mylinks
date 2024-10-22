import "server-only";

import { createServerSideHelpers } from '@trpc/react-query/server';
import { headers } from "next/headers";
import { cache } from "react";
import SuperJSON from "superjson";

import { appRouter, type AppRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createQueryClient } from "./query-client";

const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);

const context = await createContext();
const caller = appRouter.createCaller(context);

export const api = createServerSideHelpers<AppRouter>({
  ctx: context,
  transformer: SuperJSON,
  queryClient: getQueryClient(),
});
