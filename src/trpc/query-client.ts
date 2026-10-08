import { TRPCClientError } from "@trpc/client";
import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "~/server/api/root";

/** Retry network and server failures, but not answers like 404 or 403. */
function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof TRPCClientError) {
    const { data } = error as TRPCClientError<AppRouter>;
    if (data && data.httpStatus < 500) return false;
  }
  return failureCount < 2;
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: shouldRetry,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
