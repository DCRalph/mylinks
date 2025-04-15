"use client";
import { type FormEvent, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "~/trpc/react";
import Link from "next/link";
import {
  IconChevronRight,
  IconKey,
  IconUser,
  IconUserCircle,
  IconShieldLock,
  IconSparkles,
  IconTrash,
  IconDownload,
} from "@tabler/icons-react";

import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import toastOptions from "~/utils/toastOptions";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

// Define Account type based on Prisma schema
interface Account {
  id: string;
  provider: string;
  providerAccountId: string;
  userId: string;
  type: string;
  password?: string | null;
}

// Define User type based on Prisma schema
interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  flags: string | null;
  username: string | null;
  admin: boolean;
  spyPixel: boolean;
  requireSetup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Augment the User type to include accounts
interface UserWithAccounts extends User {
  accounts?: Account[];
}

export default function Settings() {
  const myUser = api.user.getUser.useQuery();

  // Cast the user to include accounts property
  const user = myUser.data?.user as UserWithAccounts | undefined;

  // Check if user has credentials provider
  const hasCredentialsProvider = user?.accounts?.some(
    (account) => account.provider === "credentials",
  );

  // Export data query
  const exportUserData = api.user.exportUserData.useQuery(undefined, {
    enabled: false, // Don't fetch on component mount
  });

  // Username state
  const [newUsername, setNewUsername] = useState(
    myUser.data?.user?.username ?? "",
  );
  const changeUsernameMutation = api.user.setUsername.useMutation();

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Create password states (for users without password)
  const [createPassword, setCreatePassword] = useState("");
  const [confirmCreatePassword, setConfirmCreatePassword] = useState("");

  // Remove password states
  const [removePasswordConfirm, setRemovePasswordConfirm] = useState("");
  const [isRemovePasswordDialogOpen, setIsRemovePasswordDialogOpen] =
    useState(false);

  // API mutations
  const createPasswordMutation = api.user.createPassword.useMutation();
  const changePasswordMutation = api.user.changePassword.useMutation();
  const removePasswordMutation = api.user.removePassword.useMutation();

  // Set initial username when data loads
  useEffect(() => {
    setNewUsername(myUser.data?.user?.username ?? "");
  }, [myUser.data?.user?.username]);

  // Change username handler
  const changeUsernameHandler = async (e: FormEvent) => {
    e.preventDefault();

    changeUsernameMutation.mutate(
      { name: newUsername },
      {
        onSuccess: () => {
          toast.success("Username changed successfully", toastOptions);
          void myUser.refetch();
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  // Change password handler
  const changePasswordHandler = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match", toastOptions);
      return;
    }

    changePasswordMutation.mutate(
      {
        currentPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          toast.success("Password changed successfully", toastOptions);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  // Create password handler (for users without password)
  const createPasswordHandler = async (e: FormEvent) => {
    e.preventDefault();

    if (createPassword !== confirmCreatePassword) {
      toast.error("Passwords don't match", toastOptions);
      return;
    }

    createPasswordMutation.mutate(
      { password: createPassword },
      {
        onSuccess: () => {
          toast.success("Password created successfully", toastOptions);
          setCreatePassword("");
          setConfirmCreatePassword("");
          void myUser.refetch();
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  // Remove password handler
  const removePasswordHandler = async () => {
    removePasswordMutation.mutate(
      { currentPassword: removePasswordConfirm },
      {
        onSuccess: () => {
          toast.success("Password authentication removed", toastOptions);
          setRemovePasswordConfirm("");
          setIsRemovePasswordDialogOpen(false);
          void myUser.refetch();
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900">
      <Nav user={myUser.data} />

      {/* Decorative elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>

      {/* Settings Content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-12 sm:px-8 lg:px-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">
              <IconSparkles className="mr-1 h-4 w-4" /> Account Settings
            </span>
            <Link href="/" className="ml-auto">
              <Button
                variant="outline"
                className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 active:translate-y-[1px]"
              >
                <IconChevronRight className="h-4 w-4 rotate-180" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="sora text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Account Settings
          </h1>
          <p className="text-lg text-zinc-400">
            Manage your account details and security preferences
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
          {/* Profile Settings Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-md">
            <div className="mb-6 flex items-center">
              <IconUserCircle className="h-6 w-6 text-blue-400" />
              <h2 className="ml-2 text-xl font-bold text-white">Profile</h2>
            </div>

            <form onSubmit={changeUsernameHandler} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName" className="text-zinc-300">
                  Username
                </Label>
                <Input
                  type="text"
                  id="userName"
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-sm text-zinc-500">
                  Your username must be between 3-20 characters and can only
                  contain letters, numbers, and underscores.
                </p>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-base font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                disabled={changeUsernameMutation.isPending}
              >
                {changeUsernameMutation.isPending
                  ? "Updating..."
                  : "Update Username"}
              </Button>
            </form>

            <div className="mt-4">
              <p className="text-sm text-zinc-400">
                Email:{" "}
                <span className="text-white">{myUser.data?.user?.email}</span>
              </p>
            </div>
          </div>

          {/* Security Settings Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <IconShieldLock className="h-6 w-6 text-blue-400" />
                <h2 className="ml-2 text-xl font-bold text-white">Security</h2>
              </div>

              {hasCredentialsProvider && (
                <Button
                  variant="outline"
                  className="border-zinc-700 bg-zinc-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                  onClick={() => setIsRemovePasswordDialogOpen(true)}
                >
                  <IconTrash className="mr-1 h-4 w-4" />
                  Remove Password
                </Button>
              )}
            </div>

            {hasCredentialsProvider ? (
              <form onSubmit={changePasswordHandler} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-zinc-300">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    id="currentPassword"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-zinc-300">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    id="newPassword"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-300">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-base font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending
                    ? "Updating..."
                    : "Change Password"}
                </Button>
              </form>
            ) : (
              <form onSubmit={createPasswordHandler} className="space-y-4">
                <div className="mb-4">
                  <p className="text-zinc-400">
                    You&apos;re currently signed in with{" "}
                    <span className="font-medium text-white">
                      {user?.accounts?.[0]?.provider ??
                        "a third-party provider"}
                    </span>
                    . Add a password to also enable email/password login.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createPassword" className="text-zinc-300">
                    Create Password
                  </Label>
                  <Input
                    type="password"
                    id="createPassword"
                    placeholder="Create a password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-zinc-500">
                    Password must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmCreatePassword"
                    className="text-zinc-300"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    id="confirmCreatePassword"
                    placeholder="Confirm your password"
                    value={confirmCreatePassword}
                    onChange={(e) => setConfirmCreatePassword(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-base font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                  disabled={createPasswordMutation.isPending}
                >
                  {createPasswordMutation.isPending
                    ? "Creating..."
                    : "Create Password"}
                </Button>
              </form>
            )}
          </div>

          {/* Advanced Options Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-md">
            <div className="mb-6 flex items-center">
              <IconKey className="h-6 w-6 text-blue-400" />
              <h2 className="ml-2 text-xl font-bold text-white">Advanced</h2>
            </div>

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start border-zinc-700 bg-zinc-800/50 text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                onClick={async () => {
                  try {
                    const data = await exportUserData.refetch();
                    if (data.data) {
                      // Convert the data to a JSON string
                      const jsonString = JSON.stringify(data.data, null, 2);

                      // Create a blob from the JSON string
                      const blob = new Blob([jsonString], {
                        type: "application/json",
                      });

                      // Create a URL for the blob
                      const url = URL.createObjectURL(blob);

                      // Create a temporary anchor element
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${user?.username ?? "user"}-data-${new Date().toISOString().split("T")[0]}.json`;

                      // Append to the body, click, and remove
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);

                      // Release the blob URL
                      URL.revokeObjectURL(url);

                      toast.success("Data exported successfully", toastOptions);
                    }
                  } catch (error) {
                    console.error("Error exporting data:", error);
                    toast.error(
                      "Failed to export data. Please try again.",
                      toastOptions,
                    );
                  }
                }}
                disabled={exportUserData.isFetching}
              >
                {exportUserData.isFetching ? (
                  "Exporting data..."
                ) : (
                  <>
                    <IconDownload className="mr-2 h-4 w-4" />
                    Export your data
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-zinc-700 bg-zinc-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={() => {
                  toast.info(
                    "Delete account functionality would be implemented here",
                    toastOptions,
                  );
                }}
              >
                Delete account
              </Button>
            </div>
          </div>

          {/* Connected Services Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-md">
            <div className="mb-6 flex items-center">
              <IconUser className="h-6 w-6 text-blue-400" />
              <h2 className="ml-2 text-xl font-bold text-white">
                Connected Services
              </h2>
            </div>

            <div className="space-y-4">
              {user?.accounts?.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
                >
                  <div className="flex items-center">
                    {account.provider === "google" ? (
                      <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        ></path>
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        ></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    ) : account.provider === "credentials" ? (
                      <IconKey className="mr-3 h-5 w-5 text-blue-400" />
                    ) : (
                      <IconUser className="mr-3 h-5 w-5 text-blue-400" />
                    )}
                    <span className="capitalize text-white">
                      {account.provider}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-400">Connected</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Remove Password Dialog */}
      <Dialog
        open={isRemovePasswordDialogOpen}
        onOpenChange={setIsRemovePasswordDialogOpen}
      >
        <DialogContent className="border border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Remove Password Authentication
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will remove the ability to sign in with your password. You
              will still be able to sign in with your other connected services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="removePasswordConfirm" className="text-zinc-300">
                Enter your current password to confirm
              </Label>
              <Input
                type="password"
                id="removePasswordConfirm"
                placeholder="Current password"
                value={removePasswordConfirm}
                onChange={(e) => setRemovePasswordConfirm(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="mt-2 border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700/50 sm:mt-0"
              onClick={() => setIsRemovePasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={removePasswordHandler}
              disabled={
                removePasswordMutation.isPending || !removePasswordConfirm
              }
            >
              {removePasswordMutation.isPending
                ? "Removing..."
                : "Remove Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
}
