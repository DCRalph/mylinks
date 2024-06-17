import Head from "next/head";
import { type GetServerSidePropsContext } from "next";
import { requireAuthAdmin } from "~/utils/requreAuth";

import { api } from "~/utils/api";
import Nav from "components/Nav";
import Footer from "components/footer";
import { useState } from "react";
import Link from "next/link";
import { IconArrowBack } from "@tabler/icons-react";
import AdminUserLinkCard from "components/Admin/adminUserLinkCard";
import AdminUserProfileCard from "components/Admin/adminUserProfileCard";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const userID = context.query.userID as string;

  const isAdmin = await requireAuthAdmin(context);

  if (!isAdmin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userID,
    },
  };
}

export default function Slug({ userID }: { userID: string }) {
  const myUser = api.user.getUser.useQuery();
  const user = api.admin.getUser.useQuery({ userID });

  const [tab, setTab] = useState<"links" | "profiles">("links");

  if (user.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>link2it | Admin</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col min-h-screen bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mx-16 grid grid-cols-3 items-center py-8">
          <div className="col-span-1 flex justify-center">
            <Link
              href="/admin"
              className="form_btn_blue flex w-min items-center gap-2"
            >
              Back
              <IconArrowBack />
            </Link>
          </div>

          {/* <h1 className="text-center text-5xl font-bold text-white col-span-1">
            Admin
          </h1> */}

          <div className="col-span-1 text-center text-5xl font-bold text-white">
            {user.data?.user?.name}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setTab("links")}
            className={`${
              tab === "links" ? "bg-white/10" : "bg-transparent"
            } rounded-md px-4 py-2 font-semibold text-white`}
          >
            Links
          </button>
          <button
            onClick={() => setTab("profiles")}
            className={`${
              tab === "profiles" ? "bg-white/10" : "bg-transparent"
            } rounded-md px-4 py-2 font-semibold text-white`}
          >
            Profiles
          </button>
        </div>

        <div className="mx-8 mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {tab === "links" &&
            user.data?.user?.Links.map((link) => (
              <AdminUserLinkCard link={link} key={link.id} />
            ))}

          {tab === "profiles" &&
            user.data?.user?.Profiles.map((profile) => (
              <AdminUserProfileCard profile={profile} key={profile.id} />
            ))}
        </div>

        <Footer />
      </main>
    </>
  );
}
