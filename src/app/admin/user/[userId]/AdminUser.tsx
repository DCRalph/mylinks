"use client";
import Head from "next/head";
import { api } from "~/trpc/react";
import { use, useState } from "react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";

import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import Link from "next/link";
import {
  IconArrowBack,
  IconDeviceFloppy,
  IconCrown,
  IconSpy,
  IconUser,
  IconLink,
  IconUserCircle,
} from "@tabler/icons-react";
import AdminUserLinkCard from "~/components/Admin/adminUserLinkCard";
import { AdminUserProfileCard } from "~/components/Admin/adminUserProfileCard";
import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function Slug({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const myUser = api.user.getUser.useQuery();
  const user = api.admin.getUser.useQuery({ userID: userId });
  const [newUsername, setNewUsername] = useState("");
  const utils = api.useUtils();

  const updateUsernameMutation = api.admin.updateUsername.useMutation({
    onSuccess: async () => {
      toast.success("Username updated successfully", toastOptions);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const toggleAdminMutation = api.admin.toggleAdminStatus.useMutation({
    onSuccess: async () => {
      toast.success(
        `Admin status ${user.data?.user?.admin ? "removed" : "granted"}`,
        toastOptions,
      );
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const toggleSpyPixelMutation = api.admin.toggleSpyPixelStatus.useMutation({
    onSuccess: async () => {
      toast.success(
        `Spy Pixel access ${user.data?.user?.spyPixel ? "removed" : "granted"}`,
        toastOptions,
      );
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;

    updateUsernameMutation.mutate({
      userID: userId,
      username: newUsername,
    });
  };

  const handleToggleAdmin = () => {
    toggleAdminMutation.mutate({ userID: userId });
  };

  const handleToggleSpyPixel = () => {
    toggleSpyPixelMutation.mutate({ userID: userId });
  };

  if (user.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-b-blue-500 border-l-transparent border-r-transparent border-t-blue-500"></div>
          <p className="text-xl">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user.data?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center text-white">
          <p className="text-xl">User not found</p>
          <Link
            href="/admin"
            className="mt-4 inline-block text-blue-500 hover:underline"
          >
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>link2it | Admin - {user.data.user.name}</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                <IconArrowBack className="h-4 w-4" />
                Back
              </Link>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                {user.data.user.name ?? "Unnamed User"}
              </h1>
            </div>

            <div className="flex gap-2">
              <Button
                variant={user.data.user.admin ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-1 ${user.data.user.admin ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                onClick={handleToggleAdmin}
                title={
                  user.data.user.admin
                    ? "Remove admin status"
                    : "Grant admin status"
                }
              >
                <IconCrown className="h-4 w-4" />
                {user.data.user.admin ? "Admin" : "Make Admin"}
              </Button>
              <Button
                variant={user.data.user.spyPixel ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-1 ${user.data.user.spyPixel ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                onClick={handleToggleSpyPixel}
                title={
                  user.data.user.spyPixel
                    ? "Remove spy pixel access"
                    : "Grant spy pixel access"
                }
              >
                <IconSpy className="h-4 w-4" />
                {user.data.user.spyPixel ? "Spy Pixel" : "Enable Spy Pixel"}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="user" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                User Info
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <IconLink className="h-4 w-4" />
                Links ({user.data.user.Links.length})
              </TabsTrigger>
              <TabsTrigger value="profiles" className="flex items-center gap-2">
                <IconUserCircle className="h-4 w-4" />
                Profiles ({user.data.user.Profiles.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="mt-0">
              <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6 text-white">
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">User Details</h3>
                    <p className="text-sm text-zinc-400">
                      <span className="font-medium text-white">ID:</span>{" "}
                      {user.data.user.id}
                    </p>
                    <p className="text-sm text-zinc-400">
                      <span className="font-medium text-white">Email:</span>{" "}
                      {user.data.user.email ?? "No email"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      <span className="font-medium text-white">Provider:</span>{" "}
                      {typeof user.data.user.accounts[0]?.provider ===
                      "undefined"
                        ? "email"
                        : user.data.user.accounts[0].provider}
                    </p>
                    <p className="text-sm text-zinc-400">
                      <span className="font-medium text-white">Username:</span>{" "}
                      {user.data.user.username ?? "No username"}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-lg font-medium">Account Status</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${user.data.user.admin ? "bg-amber-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-sm">
                          Admin: {user.data.user.admin ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${user.data.user.spyPixel ? "bg-purple-500" : "bg-red-500"}`}
                        ></div>
                        <span className="text-sm">
                          Spy Pixel: {user.data.user.spyPixel ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${user.data.user.requireSetup ? "bg-red-500" : "bg-green-500"}`}
                        ></div>
                        <span className="text-sm">
                          Setup Required:{" "}
                          {user.data.user.requireSetup ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-700 pt-6">
                  <h3 className="mb-4 text-lg font-medium">Update Username</h3>
                  <form
                    onSubmit={handleUpdateUsername}
                    className="flex flex-col gap-4 md:flex-row md:items-end"
                  >
                    <div className="flex-grow">
                      <label
                        htmlFor="newUsername"
                        className="mb-2 block text-sm font-medium text-white"
                      >
                        New Username
                      </label>
                      <Input
                        type="text"
                        id="newUsername"
                        placeholder="Enter new username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full"
                        autoComplete="off"
                        aria-autocomplete="none"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      disabled={
                        !newUsername || updateUsernameMutation.isPending
                      }
                    >
                      <IconDeviceFloppy className="h-4 w-4" />
                      {updateUsernameMutation.isPending
                        ? "Updating..."
                        : "Update Username"}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.data.user.Links.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-zinc-700 bg-zinc-900 p-6 text-center text-white">
                    <p className="text-lg">No links found for this user.</p>
                  </div>
                ) : (
                  user.data.user.Links.map((link) => (
                    <AdminUserLinkCard link={link} key={link.id} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="profiles" className="mt-0">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.data.user.Profiles.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-zinc-700 bg-zinc-900 p-6 text-center text-white">
                    <p className="text-lg">No profiles found for this user.</p>
                  </div>
                ) : (
                  user.data.user.Profiles.map((profile) => (
                    <AdminUserProfileCard
                      profile={profile}
                      key={profile.id}
                      userId={userId}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </main>
    </>
  );
}
