"use client"
import Nav from "~/components/Nav";
import Head from "next/head";

import { api } from '~/trpc/react';
import { toast } from "react-toastify";
import { type FormEvent, useEffect, useState } from "react";
import Footer from "~/components/footer";
import { IconSquareRoundedPlus } from "@tabler/icons-react";
import toastOptions from "~/utils/toastOptions";
import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function Setup() {
  const myUser = api.user.getUser.useQuery();

  const [newUsername, setNewUsername] = useState(
    myUser.data?.user?.username ?? "",
  );
  const createUsername = api.setup.createUsername.useMutation();

  useEffect(() => {
    setNewUsername(myUser.data?.user?.username ?? "");
  }, [myUser.data?.user?.username]);

  const changeUsernameHandler = async (e: FormEvent) => {
    e.preventDefault();

    createUsername.mutate(
      { username: newUsername },
      {
        onSuccess: () => {
          toast.success("Username changed successfully", toastOptions);

          myUser
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, toastOptions);
            });

          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
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
        <title>link2it | Setup</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 grid h-4 grid-cols-12">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">Setup</h1>
          </div>

          <div className="col-span-4 col-start-5  mt-8 flex justify-center">
            <form
              onSubmit={changeUsernameHandler}
              className="grid w-full grid-cols-2 gap-4"
            >
              <div className="col-span-full flex justify-center py-4 text-white">
                <h1 className="text-3xl">Create your username</h1>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="newUsername"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Username
                </label>
                <Input
                  type="text"
                  id="newUsername"
                  placeholder="Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <Button
                className="form_btn_blue  flex items-center justify-center gap-2"
                type="submit"
              >
                Create
                <IconSquareRoundedPlus />
              </Button>
            </form>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}