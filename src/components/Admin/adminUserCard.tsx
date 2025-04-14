import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import type { adminRouter } from "~/server/api/routers/admin";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import { Button } from "~/components/ui/button";
import {
  IconCrown,
  IconSpy,
  IconUser,
  IconArrowRight,
} from "@tabler/icons-react";

type RouterOutput = inferRouterOutputs<typeof adminRouter>;

type AdminUserCardProps = {
  User: RouterOutput["getUsers"][number];
};

export default function AdminUserCard({ User }: AdminUserCardProps) {
  const utils = api.useUtils();

  const toggleAdminMutation = api.admin.toggleAdminStatus.useMutation({
    onSuccess: async () => {
      toast.success(
        `Admin status ${User.admin ? "removed" : "granted"}`,
        toastOptions,
      );
      await utils.admin.getUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const toggleSpyPixelMutation = api.admin.toggleSpyPixelStatus.useMutation({
    onSuccess: async () => {
      toast.success(
        `Spy Pixel access ${User.spyPixel ? "removed" : "granted"}`,
        toastOptions,
      );
      await utils.admin.getUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const handleToggleAdmin = () => {
    toggleAdminMutation.mutate({ userID: User.id });
  };

  const handleToggleSpyPixel = () => {
    toggleSpyPixelMutation.mutate({ userID: User.id });
  };

  return (
    <div className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-white shadow-lg transition-all hover:border-zinc-500 hover:shadow-xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{User.name ?? "Unnamed User"}</h3>
          <p className="text-sm text-zinc-400">
            {User.username ?? "No username"} • {User.id.slice(0, 8)}...
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={User.admin ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-1 ${User.admin ? "bg-amber-600 hover:bg-amber-700" : ""}`}
            onClick={handleToggleAdmin}
            title={User.admin ? "Remove admin status" : "Grant admin status"}
          >
            <IconCrown className="h-4 w-4" />
          </Button>
          <Button
            variant={User.spyPixel ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-1 ${User.spyPixel ? "bg-purple-600 hover:bg-purple-700" : ""}`}
            onClick={handleToggleSpyPixel}
            title={
              User.spyPixel
                ? "Remove spy pixel access"
                : "Grant spy pixel access"
            }
          >
            <IconSpy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-zinc-300">
          <span className="font-medium">Email:</span> {User.email ?? "No email"}
        </p>
        <p className="text-sm text-zinc-300">
          <span className="font-medium">Provider:</span>{" "}
          {typeof User.accounts[0]?.provider === "undefined"
            ? "email"
            : User.accounts[0].provider}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs">
          <IconUser className="h-3 w-3" />
          <span>{User.Links.length} Links</span>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs">
          <IconUser className="h-3 w-3" />
          <span>{User.Profiles.length} Profiles</span>
        </div>
      </div>

      <Link
        href={`/admin/user/${User.id}`}
        className="mt-auto flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Manage User
        <IconArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
