import Nav from "components/Nav";
import Head from "next/head";

import { type GetServerSidePropsContext } from "next";
import { requireAuth } from "~/utils/requreAuth";
import { checkRequireSetup } from "~/utils/requireSetup";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
import { type FormEvent, useEffect, useState } from "react";

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
          toast.success("Username changed successfully", {
            closeOnClick: true,
            pauseOnHover: true,
          });

          myUser
            .refetch()
            .then()
            .catch((error: string) => {
              toast.error(error, {
                closeOnClick: true,
                pauseOnHover: true,
              });
            });

          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
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
        <title>link2it | Setup</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-zinc-950">
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
                <input
                  type="text"
                  id="newUsername"
                  className="block w-full rounded-lg border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Name"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <button
                className="col-span-full mt-auto h-min w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 sm:w-auto"
                type="submit"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
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

  if (!needsSetup) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
