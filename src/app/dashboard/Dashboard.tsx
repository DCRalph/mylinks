// app/dashboard/Dashboard.tsx
"use client";

import React, { useState } from "react";
import Nav from "~/components/Nav";
import Head from "next/head";
import { api } from "~/trpc/react";
import DashLink from "~/components/Dashboard/Links/DashLink";
import DashProfileListItem from "~/components/Dashboard/Profiles/DashProfileListItem";
import { toast } from "react-toastify";
import DashProfileCreateModel from "~/components/Dashboard/Profiles/DashProfileCreateModel";
import Footer from "~/components/footer";
import { IconLoader2, IconSquareRoundedPlus } from "@tabler/icons-react";
import toastOptions from "~/utils/toastOptions";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

export default function Dashboard() {
  const [createProfileModelOpen, setCreateProfileModelOpen] = useState(false);

  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkSlug, setNewLinkSlug] = useState("");

  const myUser = api.user.getUser.useQuery();
  const myLinks = api.link.getMyLinks.useQuery();
  const myProfiles = api.profile.getProfiles.useQuery();

  const createLinkMutation = api.link.createLink.useMutation();

  const createLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    createLinkMutation.mutate(
      { name: newLinkName, url: newLinkUrl, slug: newLinkSlug },
      {
        onSuccess: () => {
          toast.success("Link created successfully", toastOptions);

          setNewLinkName("");
          setNewLinkUrl("");
          setNewLinkSlug("");

          myLinks
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
        <title>link2it | dashboard</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mx-8 mt-8 grid grid-cols-12 gap-8">
          {/* <div className="col-span-full flex items-center justify-center gap-4">
            <span className=" text-2xl text-white">Your personal link is:</span>

            <div className="rounded-lg border-2 border-zinc-600 bg-black bg-opacity-10 px-4 py-2 shadow-md ">
              <span className=" flex items-center text-2xl text-white">
                {env.NEXT_PUBLIC_SHORT_DOMAIN}/{myUser.data?.user?.username}
                <Copy text={`${env.NEXT_PUBLIC_DOMAIN}/${myUser.data?.user?.username}`} />
              </span>
            </div>
          </div> */}

          <div className="col-span-full flex flex-col items-center lg:col-span-5 lg:col-start-2">
            <span className="text-3xl text-white">Your Profiles:</span>

            <div className="mb-24 mt-4 flex w-full flex-col gap-4">
              <div className="flex w-full justify-center gap-4">
                <Button
                  className="form_btn_blue flex items-center gap-2"
                  onClick={() => setCreateProfileModelOpen(true)}
                >
                  <IconSquareRoundedPlus />
                  Create Profile
                </Button>
              </div>

              {myProfiles.data?.profiles?.map((profile) => (
                <DashProfileListItem key={profile.id} profile={profile} />
              ))}
            </div>
          </div>

          <div className="col-span-full flex flex-col items-center lg:col-span-5 lg:col-start-7">
            <span className="text-3xl text-white">Your links:</span>

            <form
              onSubmit={createLinkHandler}
              className="mt-4 flex w-full flex-col gap-4 rounded-lg bg-zinc-800 p-4"
            >
              <div className="col-span-full flex justify-center">
                <span className="text-2xl text-white">Create Link</span>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="newLinkName"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Name
                </label>
                <Input
                  id="newLinkName"
                  placeholder="Name"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="newLinkUrl"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Long URL
                </label>
                <Input
                  id="newLinkUrl"
                  placeholder="Long Url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="newLinkSlug"
                  className="mb-2 block text-sm font-medium text-white"
                >
                  Slug (Leave empty for random slug)
                </label>
                <Input
                  id="newLinkSlug"
                  placeholder="Custom slug"
                  value={newLinkSlug}
                  onChange={(e) => setNewLinkSlug(e.target.value)}
                />
              </div>

              <Button
                className="form_btn_blue flex items-center justify-center gap-2"
                disabled={createLinkMutation.isPending ? true : false}
                type="submit"
              >
                {createLinkMutation.isPending ? (
                  <IconLoader2 className="animate-spin" />
                ) : (
                  <IconSquareRoundedPlus />
                )}
                Create
              </Button>
            </form>

            <div className="mt-4 flex w-full flex-col gap-4">
              {myLinks.data?.links?.map((link) => (
                <DashLink key={link.id} link={link} />
              ))}
            </div>
          </div>

          {/*  */}
        </div>

        <Footer />
      </main>
      <DashProfileCreateModel
        isOpen={createProfileModelOpen}
        setIsOpen={setCreateProfileModelOpen}
      />
    </>
  );
}
