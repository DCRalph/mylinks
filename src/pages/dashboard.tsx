import Nav from "components/Nav";
import Head from "next/head";

import { env } from "~/env.js";

import { type GetServerSidePropsContext } from "next";
import { api } from "~/utils/api";

import { requireAuth } from "~/utils/requreAuth";
import Copy from "components/copy";
import DashLink from "components/DashLink";
import { useState } from "react";
import { toast } from 'react-toastify';


export default function Dashboard() {

  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkSlug, setNewLinkSlug] = useState('');

  const myUser = api.user.getUser.useQuery();
  const myUrls = api.link.getMyUrls.useQuery();

  const createLinkMutation = api.link.createLink.useMutation();

  const createLinkHandler = async (e: React.FormEvent) => {
    e.preventDefault();


    createLinkMutation.mutate({ name: newLinkName, url: newLinkUrl, slug: newLinkSlug }, {
      onSuccess: () => {
        toast.success('Link created successfully', {
          closeOnClick: true,
          pauseOnHover: true,
        });
        setNewLinkName('');
        setNewLinkUrl('');
        setNewLinkSlug('');

        myUrls.refetch()
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
        <title>mylinks | dashboard</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 grid grid-cols-3 mx-16">
          {/*  */}
          {/* <div className="col-span-full flex flex-col items-center">
            <h1 className="text-5xl font-bold text-white">dashboard</h1>

            <h1 className="text-5xl font-bold text-white">
              Welcome { }
              {sessionData.user.name}
            </h1>
          </div> */}

          <div className="col-span-full flex items-center justify-center gap-4">
            {/* <span className=" text-2xl text-white">Your personal link is:</span> */}

            <div className="rounded-lg border-2 border-slate-600 bg-black bg-opacity-10 px-4 py-2 shadow-md ">
              <span className=" flex items-center text-2xl text-white">
                {env.NEXT_PUBLIC_SHORT_DOMAIN}/{myUser.data?.user?.username}
                <Copy text={`${env.NEXT_PUBLIC_DOMAIN}/${myUser.data?.user?.username}`} />
              </span>
            </div>
          </div>

          <div className="col-span-full flex justify-center mt-8">
            <form onSubmit={createLinkHandler} className="grid grid-cols-2 gap-4 w-full max-w-3xl">

              <div className="col-span-full md:col-span-1">
                <label htmlFor="newLinkName" className="block mb-2 text-sm font-medium text-white">Name</label>
                <input type="text" id="newLinkName" className="text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Name" value={newLinkName} onChange={(e) => setNewLinkName(e.target.value)} required />
              </div>

              <div className="col-span-full md:col-span-1">
                <label htmlFor="newLinkUrl" className="block mb-2 text-sm font-medium text-white">Long URL</label>
                <input type="text" id="newLinkUrl" className="text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Long Url" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} required />
              </div>

              <div className="col-span-full md:col-span-1">
                <label htmlFor="newLinkSlug" className="block mb-2 text-sm font-medium text-white">Slug</label>
                <input type="text" id="newLinkSlug" className="text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Slug" value={newLinkSlug} onChange={(e) => setNewLinkSlug(e.target.value)} required />
              </div>

              <button className="text-white col-span-full md:col-span-1 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm w-full mt-auto h-min sm:w-auto px-5 py-2.5 text-center bg-blue-600 hover:bg-blue-700 focus:ring-blue-800" disabled={createLinkMutation.isLoading} type="submit">Create</button>

            </form>
          </div>

          <div className="col-span-full mt-16 flex flex-col items-center">

            <span className="text-3xl text-white">Your links:</span>

            <div className="flex mt-8 mb-24 flex-col gap-4 max-w-xl w-full px-16">
              {myUrls.data?.urls.map((url) => (
                <DashLink key={url.id} url={url} />
              ))
              }

            </div>


          </div>

          {/*  */}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return requireAuth(context);
}
