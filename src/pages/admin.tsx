import Nav from "components/Nav";
import Head from "next/head";
import { api } from "~/utils/api";

import { type GetServerSidePropsContext } from "next";
import { requireAuthAdmin } from "~/utils/requreAuth";
import { checkRequireSetup } from "~/utils/requireSetup";
import Footer from "components/footer";
import AdminUserCard from "components/Admin/adminUserCard";

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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const needsSetup = await checkRequireSetup(context);
  const isAdmin = await requireAuthAdmin(context);

  if (!isAdmin) {
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
