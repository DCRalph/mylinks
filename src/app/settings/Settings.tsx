'use client';
import Nav from "~/components/Nav";
import Head from "next/head";

import { api } from '~/trpc/react';
import { type FormEvent, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Footer from "~/components/footer";
import toastOptions from '~/utils/toastOptions';
import React from "react";

export default function Settings() {
  const myUser = api.user.getUser.useQuery();

  const [newUsername, setNewUsername] = useState(
    myUser.data?.user?.username ?? "",
  );
  const changeUsernameMutation = api.user.setUsername.useMutation();

  useEffect(() => {
    setNewUsername(myUser.data?.user?.username ?? "");
  }, [myUser.data?.user?.username]);

  const changeUsernameHandler = async (e: FormEvent) => {
    e.preventDefault();

    changeUsernameMutation.mutate(
      { name: newUsername },
      {
        onSuccess: () => {
          toast.success("Username changed successfully", toastOptions);

          myUser
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, toastOptions);
            });
        },
        onError: (error) => {
          toast.error(error.message, toastOptions);
        },
      },
    );
  };

  return (
    <>
      <Head>
        <title>link2it | settings</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 grid h-4 grid-cols-12">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">Settings</h1>
          </div>

          <form
            onSubmit={changeUsernameHandler}
            className="col-span-6 col-start-4 mt-8 flex flex-col gap-4 md:flex-row"
          >
            <div className="grow">
              <label
                htmlFor="userName"
                className="mb-2 block text-sm font-medium text-white"
              >
                Username
              </label>
              <input
                type="text"
                id="userName"
                className="form_input"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>

            <button
              className="form_btn_blue mt-auto"
              disabled={changeUsernameMutation.isPending}
              type="submit"
            >
              Change
            </button>
          </form>
        </div>

        <Footer />
      </main>
    </>
  );
}