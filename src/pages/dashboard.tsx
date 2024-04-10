import Nav from "components/Nav";
import Head from "next/head";

import { type GetServerSidePropsContext } from "next";
import { api } from "~/utils/api";

import { requireAuth } from "~/utils/requreAuth";
import { checkRequireSetup } from "~/utils/requireSetup";
import DashLink from "components/Dashboard/Links/DashLink";
import DashProfileListItem from "components/Dashboard/Profiles/DashProfileListItem";
import { useState } from "react";
import { toast } from "react-toastify";
import DashProfileCreateModel from "components/Dashboard/Profiles/DashProfileCreateModel";
import Footer from "components/footer";

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
          toast.success("Link created successfully", {
            closeOnClick: true,
            pauseOnHover: true,
          });

          setNewLinkName("");
          setNewLinkUrl("");
          setNewLinkSlug("");

          myLinks
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, {
                closeOnClick: true,
                pauseOnHover: true,
              });
            });
        },
        onError: (error) => {
          toast.error(error.message, {
            closeOnClick: true,
            pauseOnHover: true,
          });
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
      <main className="relative min-h-screen bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mx-8 mt-8 grid grid-cols-12 gap-4">
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
                <button
                  className="form_btn_blue"
                  onClick={() => setCreateProfileModelOpen(true)}
                >
                  Create Profile
                </button>
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
                <input
                  type="text"
                  id="newLinkName"
                  className="form_input"
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
                <input
                  type="text"
                  id="newLinkUrl"
                  className="form_input"
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
                <input
                  type="text"
                  id="newLinkSlug"
                  className="form_input"
                  placeholder="Custom slug"
                  value={newLinkSlug}
                  onChange={(e) => setNewLinkSlug(e.target.value)}
                />
              </div>

              <button
                className="form_btn_blue"
                disabled={createLinkMutation.isLoading}
                type="submit"
              >
                Create
              </button>
            </form>

            <div className="mb-24 mt-4 flex w-full flex-col gap-4">
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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const needsSetup = await checkRequireSetup(context);
  const logedIn = await requireAuth(context);

  if (!logedIn) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (needsSetup) {
    return {
      redirect: {
        destination: "/setup",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
