import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import type { adminRouter } from "~/server/api/routers/admin";

type RouterOutput = inferRouterOutputs<typeof adminRouter>;

type AdminUserCardProps = {
  User: RouterOutput["getUsers"][number];
};

export default function AdminUserCard({ User }: AdminUserCardProps) {
  return (
    <div className="grid grid-cols-12 gap-4 rounded-lg border-2 border-zinc-600 bg-zinc-900 p-4 text-white shadow-lg">
      <div className="col-span-full lg:col-span-8">
        <p className="text-3xl font-bold">{User.name} </p>
        <p className="text-sm font-bold lg:text-lg">
          {User.username ?? "Unknown"} - {User.id}
        </p>
        <p className="text-sm font-bold lg:text-lg">Email: {User.email}</p>

        <p className="text-sm font-bold lg:text-lg">
          Provider:{" "}
          {typeof User.accounts[0]?.provider == "undefined"
            ? "email"
            : User.accounts[0].provider}
        </p>

        {/* <p className="text-sm font-bold lg:text-lg">Role: {User.role}</p> */}

        <p className="text-sm font-bold lg:text-lg">
          Links: {User.Links.length} - Profiles: {User.Profiles.length}
        </p>
      </div>
      <div className="col-span-full lg:col-span-4">
        <div className="flex lg:justify-end">
          {/* <button className="form_btn_blue">Manage</button> */}
          <Link href={`/admin/user/${User.id}`} className="form_btn_blue">
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}
