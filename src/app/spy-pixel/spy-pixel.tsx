"use client";

import { useState } from "react";
import Nav from "~/components/Nav";
import Head from "next/head";
import { api } from "~/trpc/react";
import Footer from "~/components/footer";
import { Button } from "~/components/ui/button";
import { IconSquareRoundedPlus } from "@tabler/icons-react";
import SpyPixelList from "~/components/Spypixel/SpyPixelList";
import CreateSpyPixelDialog from "~/components/Spypixel/CreateSpyPixelDialog";

export default function SpyPixelPage() {
  const myUser = api.user.getUser.useQuery();

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <Head>
        <title>link2it | Admin</title>
        <meta name="description" content="Link sharing website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col bg-zinc-950">
        <Nav user={myUser.data} />
        <div className="mt-16 grid h-4 grid-cols-12">
          <div className="col-span-full flex justify-center">
            <h1 className="text-5xl font-bold text-white">Spy Pixels</h1>
          </div>
        </div>

        <div className="container mx-auto p-8 mt-8">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreateDialogOpen(true)} className="form_btn_blue">
              <IconSquareRoundedPlus />
              Create Spy Pixel
            </Button>
          </div>

          {/* List of Spy Pixels */}
          <SpyPixelList />

          {/* Dialog for creating a new spy pixel */}
          <CreateSpyPixelDialog
            isOpen={isCreateDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
