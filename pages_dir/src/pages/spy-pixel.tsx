import Nav from "~/components/Nav";
import Head from "next/head";
import { api } from "~/utils/api";

import { type GetServerSidePropsContext } from "next";
import { requireSpyPixel } from "~/utils/requreAuth";
import { checkRequireSetup } from "~/utils/requireSetup";
import Footer from "~/components/footer";


export default function SpyPixel() {
  const myUser = api.user.getUser.useQuery();

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
          Spy Pixel
        </h1>

        



        <Footer />
      </main>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const needsSetup = await checkRequireSetup(context);
  const allowed = await requireSpyPixel(context);

  if (!allowed) {
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