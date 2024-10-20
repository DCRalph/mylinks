"use client"
import Nav from "~/components/Nav";
import Head from "next/head";
import { api } from '~/trpc/react';

import Footer from "~/components/footer";
import AdminUserCard from "~/components/Admin/adminUserCard";

export default function Admin() {
  const myUser = api.user.getUser.useQuery();
  const users = api.admin.getUsers.useQuery();

  return (
    <>
      <Head>
        <title>link2it | Admin</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <h1 className="py-8 text-center text-5xl font-bold text-white">
          Admin
        </h1>

        <div className="mx-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.data?.map((user) => AdminUserCard({ User: user }))}
        </div>

        <Footer />
      </main>
    </>
  );
}
