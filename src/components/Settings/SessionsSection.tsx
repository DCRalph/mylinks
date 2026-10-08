"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import SessionList from "~/components/SessionList";
import { Button } from "~/components/ui/button";
import { authClient, unwrap } from "~/lib/auth-client";

const KEY = ["sessions"];

/** Your signed-in devices, with sign-out per device or for all the others. */
export default function SessionsSection({
  currentSessionId,
}: {
  currentSessionId: string;
}) {
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: KEY,
    queryFn: () => unwrap(authClient.listSessions()),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });
  const onError = (error: Error) => toast.error(error.message);

  const revoke = useMutation({
    mutationFn: (token: string) => unwrap(authClient.revokeSession({ token })),
    onSuccess: refresh,
    onError,
  });
  const revokeOthers = useMutation({
    mutationFn: () => unwrap(authClient.revokeOtherSessions()),
    onSuccess: async () => {
      toast.success("Signed out of every other device");
      await refresh();
    },
    onError,
  });

  const list = sessions.data ?? [];
  const others = list.filter((session) => session.id !== currentSessionId);

  return (
    <>
      {sessions.isPending ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <SessionList
          sessions={list}
          currentId={currentSessionId}
          onRevoke={(session) => revoke.mutate(session.token)}
          revoking={revoke.isPending ? revoke.variables : null}
        />
      )}
      {others.length > 0 && (
        <Button
          variant="outline"
          className="mt-4"
          disabled={revokeOthers.isPending}
          onClick={() => revokeOthers.mutate()}
        >
          Sign out other devices
        </Button>
      )}
    </>
  );
}
