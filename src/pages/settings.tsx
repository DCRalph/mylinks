import Nav from "components/Nav";
import Head from "next/head";

import { type GetServerSidePropsContext } from "next";
import { requireAuth } from "~/utils/requreAuth";
import { api } from "~/utils/api";
import { type FormEvent, useState, useEffect } from "react";
import { toast } from 'react-toastify';

export default function Settings() {


  const myUser = api.user.getUser.useQuery();


  const [newUsername, setNewUsername] = useState(myUser.data?.user?.username ?? '');
  const changeUsernameMutation = api.user.setUsername.useMutation();

  useEffect(() => {
    setNewUsername(myUser.data?.user?.username ?? '');
  }, [myUser.data?.user?.username]);

  const changeUsernameHandler = async (e: FormEvent) => {
    e.preventDefault();

    changeUsernameMutation.mutate({ name: newUsername }, {
      onSuccess: () => {
        toast.success('Username changed successfully', {
          closeOnClick: true,
          pauseOnHover: true,
        });

        myUser.refetch()
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
      }
    });
  }

  return (
    <>
      <Head>
        <title>link2it | settings</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 grid h-4 grid-cols-12">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">Settings</h1>
          </div>


          <form onSubmit={changeUsernameHandler} className="col-start-4 col-span-6 flex flex-col md:flex-row gap-4 mt-8">

            <div className="grow">
              <label htmlFor="userName" className="block mb-2 text-sm font-medium text-white">Username</label>
              <input type="text" id="userName" className="text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
            </div>

            <button className="text-white focus:ring-4 focus:outline-none font-medium rounded-lg text-sm w-full mt-auto h-min sm:w-auto px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800" disabled={changeUsernameMutation.isLoading} type="submit">Change</button>

          </form>
        </div>

      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return requireAuth(context);
}
