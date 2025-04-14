"use client";
import Nav from "~/components/Nav";
import Head from "next/head";
import { api } from "~/trpc/react";
import { useState } from "react";

import Footer from "~/components/footer";
import AdminUserCard from "~/components/Admin/adminUserCard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { IconSearch, IconRefresh } from "@tabler/icons-react";

export default function Admin() {
  const myUser = api.user.getUser.useQuery();
  const users = api.admin.getUsers.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const utils = api.useUtils();

  // Filter users based on search term
  const filteredUsers = users.data?.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ??
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ??
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRefresh = async () => {
    await utils.admin.getUsers.invalidate();
  };

  return (
    <>
      <Head>
        <title>link2it | Admin</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              Admin Dashboard
            </h1>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IconSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleRefresh}
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mb-4 text-lg text-white">
            {filteredUsers?.length}{" "}
            {filteredUsers?.length === 1 ? "User" : "Users"} found
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers?.map((user) => (
              <AdminUserCard key={user.id} User={user} />
            ))}
          </div>

          {filteredUsers?.length === 0 && (
            <div className="mt-8 text-center text-xl text-white">
              No users found matching your search.
            </div>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
