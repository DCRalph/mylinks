import Nav from "components/Nav";
import { useSession } from "next-auth/react";
import Head from "next/head";

export default function Dashboard() {
  const sessionData = useSession();

  if (sessionData.status === "loading") {
    return <div>Loading...</div>;
  }

  if (sessionData.status === "unauthenticated") {
    return <div>Unauthenticated</div>;
  }

  return (
    <>
      <Head>
        <title>mylinks</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-zinc-950">
        <Nav sessionData={sessionData} />

        <div className="mt-16 grid h-4 grid-cols-3">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">dashboard</h1>
          </div>
        </div>
      </main>
    </>
  );
}
