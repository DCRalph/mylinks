// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth"; // Adjust the import to your authOptions
import { getProviders, signIn } from "next-auth/react";

import { checkRequireSetup } from "~/utils/requireSetup";

import SignIn from "./Signin";
import React from "react";

export default async function SigninPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    // User is not authenticated, redirect to home page
    redirect("/");
  }

  const providers = await getProviders();

  return <SignIn providers={providers} />;
}
