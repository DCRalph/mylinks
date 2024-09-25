import Head from "next/head";
import { type GetServerSidePropsContext } from "next";
import { requireAuthAdmin } from "~/utils/requreAuth";

import { api } from "~/utils/api";
import Nav from "~/components/Nav";
import Footer from "~/components/footer";
import { useState } from "react";
import Link from "next/link";
import { IconArrowBack, IconDeviceFloppy } from "@tabler/icons-react";
import AdminUserLinkCard from "~/components/Admin/adminUserLinkCard";
import AdminUserProfileCard from "~/components/Admin/adminUserProfileCard";

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

  const [tab, setTab] = useState<"user" | "links" | "profiles">("user");

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
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="grid grid-cols-3 items-center gap-4 py-8 lg:mx-16">
          <div className="col-span-full flex justify-center lg:col-span-1"></div>

          {/* <h1 className="text-center text-5xl font-bold text-white col-span-1">
            Admin
          </h1> */}

          <div className="col-span-full text-center text-5xl font-bold text-white lg:col-span-1">
            {user.data?.user?.name}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href="/admin"
            className="form_btn_blue flex w-min items-center gap-2"
          >
            Back
            <IconArrowBack />
          </Link>

          <button
            onClick={() => setTab("user")}
            className={`${
              tab === "user" ? "bg-white/10" : "bg-transparent"
            } rounded-md px-4 py-2 font-semibold text-white`}
          >
            User
          </button>

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
          {tab === "user" && (
            <div className="col-span-full flex flex-col items-center text-white">
              <p className="text-3xl font-bold">{user.data?.user?.name} </p>
              <p className=" text-lg font-bold">ID: {user.data?.user?.id}</p>
              <p className=" text-lg font-bold">
                Email: {user.data?.user?.email}
              </p>

              <p className=" text-lg font-bold">
                Provider:{" "}
                {typeof user.data?.user?.accounts[0]?.provider == "undefined"
                  ? "email"
                  : user.data?.user?.accounts[0].provider}
              </p>

              {/* <p className=" text-lg font-bold">
                Role: {user.data?.user?.role}
              </p> */}

              <p className=" text-lg font-bold">
                Links: {user.data?.user?.Links.length} - Profiles:{" "}
                {user.data?.user?.Profiles.length}
              </p>

              <form
                // onSubmit={changeUsernameHandler}
                className=" mt-8 flex items-end gap-4"
              >
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
                    className="form_input"
                    placeholder="Username"
                    // value={newUsername}
                    // onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>

                <button
                  className="form_btn_blue flex items-center justify-center gap-2"
                  type="submit"
                >
                  Change
                  <IconDeviceFloppy />
                </button>
              </form>
            </div>
          )}
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
