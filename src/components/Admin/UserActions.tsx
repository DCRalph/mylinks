"use client";

import { IconEye } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ConfirmDelete from "~/components/ConfirmDelete";
import { Button } from "~/components/ui/button";
import { authClient, unwrap } from "~/lib/auth-client";
import { can, isStaff } from "~/lib/permissions";
import { reloadTo } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { Viewer } from "./AdminUser";
import { Panel } from "./Panel";

/** View the app as the user, or delete them. Renders nothing if neither is allowed. */
export default function UserActions({
  user,
  viewer,
}: {
  user: { id: string; name: string; role: string };
  viewer: Viewer;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const onError = (error: Error) => toast.error(error.message);

  const impersonate = useMutation({
    mutationFn: () =>
      unwrap(authClient.admin.impersonateUser({ userId: user.id })),
    // A full load so every server component renders as them.
    onSuccess: () => reloadTo("/dashboard"),
    onError,
  });
  const remove = useMutation({
    mutationFn: () => unwrap(authClient.admin.removeUser({ userId: user.id })),
    onSuccess: async () => {
      toast.success(`Deleted ${user.name}`);
      await utils.admin.getUsers.invalidate();
      router.push("/admin/users");
    },
    onError,
  });

  // Staff can't be viewed as, so their access can't be borrowed.
  const canImpersonate =
    can(viewer, { user: ["impersonate"] }) && !isStaff(user);
  const canDelete = can(viewer, { user: ["delete"] });
  if (!canImpersonate && !canDelete) return null;

  return (
    <Panel title="Actions">
      <div className="grid gap-4">
        {canImpersonate && (
          <Row
            title="View as user"
            description="Use the app signed in as them for up to an hour. Logged in the audit log."
          >
            <Button
              size="sm"
              variant="outline"
              disabled={impersonate.isPending}
              onClick={() => impersonate.mutate()}
            >
              <IconEye /> View as
            </Button>
          </Row>
        )}
        {canDelete && (
          <Row
            title="Delete user"
            description="Removes the account with its links, profiles, pixels and bookmarks."
          >
            <ConfirmDelete
              size="sm"
              title={`Delete ${user.name}?`}
              description="Their account and everything in it is removed for good. Their short links stop working."
              pending={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          </Row>
        )}
      </div>
    </Panel>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
}
