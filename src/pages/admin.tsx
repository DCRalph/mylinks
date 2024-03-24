import Nav from "components/Nav";
import Head from "next/head";
import { api } from "~/utils/api";

import { type GetServerSidePropsContext } from "next";
import { requireAuthAdmin } from "~/utils/requreAuth";


export default function Admin() {
  const myUser = api.user.getUser.useQuery();
  const users = api.user.getUsers.useQuery()

  return (
    <>
      <Head>
        <title>link2it | Admin</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-zinc-950">
        <Nav user={myUser.data} />

        <div className="mt-16 grid h-4 grid-cols-3">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">Admin</h1>
          </div>
        </div>



        <div className="mt-16 flex justify-center text-white">
          <table className="container table-auto">
            <thead>
              <tr>
                <th className="text-left">ID</th>
                <th className="text-left">Name</th>
                <th className="text-left">Username</th>
                <th className="text-left">Email</th>
                <th className="text-left">Provider</th>
                <th className="text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.username ?? "Unknown"}</td>
                  <td>{user.email}</td>
                  <td>{typeof user.accounts[0]?.provider == "undefined" ? "email" : user.accounts[0].provider}</td>
                  <td>{user.role}</td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return requireAuthAdmin(context);
}
