// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth"; // Adjust the import to your authOptions
import { checkRequireSetup } from "~/utils/requireSetup";
import { requireSpyPixel } from "~/utils/requreAuth";
import React from "react";
import SpyPixelPage from "./spy-pixel";
export default async function SpyPixel() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // User is not authenticated, redirect to home page
    redirect("/");
  }

  const needsSetup = await checkRequireSetup();

  if (needsSetup) {
    // User needs to complete setup, redirect to setup page
    redirect("/setup");
  }

  const hasSpyPixel = await requireSpyPixel();

  if (!hasSpyPixel) {
    // User does not have access to spy pixel, redirect to home page
    redirect("/");
  }

  return <SpyPixelPage />;
}
