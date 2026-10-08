"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import SessionList from "~/components/SessionList";
import { Button } from "~/components/ui/button";
import { authClient, unwrap } from "~/lib/auth-client";
import { can } from "~/lib/permissions";
import type { Viewer } from "./AdminUser";
import { Panel } from "./Panel";

export const sessionsKey = (userId: string) => ["admin", "sessions", userId];

/** Where a user is signed in, with sign-out per device or everywhere. */
export default function UserSessions({
  userId,
  viewer,
}: {
  userId: string;
  viewer: Viewer;
}) {
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: sessionsKey(userId),
    queryFn: () => unwrap(authClient.admin.listUserSessions({ userId })),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: sessionsKey(userId) });
  const onError = (error: Error) => toast.error(error.message);

  const revoke = useMutation({
    mutationFn: (sessionToken: string) =>
      unwrap(authClient.admin.revokeUserSession({ sessionToken })),
    onSuccess: refresh,
    onError,
  });
  const revokeAll = useMutation({
    mutationFn: () => unwrap(authClient.admin.revokeUserSessions({ userId })),
    onSuccess: async () => {
      toast.success("Signed out everywhere");
      await refresh();
    },
    onError,
  });

  const canRevoke = can(viewer, { session: ["revoke"] });
  const list = sessions.data?.sessions ?? [];

  return (
    <Panel
      title="Sessions"
      className="mb-3.5"
      action={
        canRevoke &&
        list.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={revokeAll.isPending}
            onClick={() => revokeAll.mutate()}
          >
            Sign out everywhere
          </Button>
        )
      }
    >
      {sessions.isPending ? (
        <p className="text-muted">Loading…</p>
      ) : sessions.error ? (
        <p className="text-danger">{sessions.error.message}</p>
      ) : (
        <SessionList
          sessions={list}
          onRevoke={
            canRevoke ? (session) => revoke.mutate(session.token) : undefined
          }
          revoking={revoke.isPending ? revoke.variables : null}
        />
      )}
    </Panel>
  );
}
