"use client";

import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { IconBook, IconLink } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import Link from "next/link";

import { signIn } from "next-auth/react";

import { type ClientSafeProvider, type LiteralUnion } from "next-auth/react";
import { type BuiltInProviderType } from "next-auth/providers/index";

const googleIcon = (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    ></path>
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    ></path>
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    ></path>
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    ></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

const getIconByProvider = (provider: string) => {
  switch (provider) {
    case "google":
      return googleIcon;
    default:
      return null;
  }
};

export default function SignIn({
  providers,
}: {
  providers: Record<
    LiteralUnion<BuiltInProviderType>,
    ClientSafeProvider
  > | null;
}) {
  const filteredProviders = Object.values(providers ?? [])
    .filter((p) => {
      if (p.id === "credentials") return false;
      return true;
    })
    .map((p) => {
      return { ...p, icon: getIconByProvider(p.id) };
    });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const credSignIn = async () => {
    toast.error(
      "Email and password disabled. Please use google sign in",
      toastOptions,
    );
    return;

    if (!email || !password) {
      toast.error("Please enter your email and password", toastOptions);
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log(res);

    if (res?.error) {
      toast.error("Error Signing in", toastOptions);

      setEmail("");
      setPassword("");

      return;
    }

    if (res?.ok) {
      toast.success("Signed in!", toastOptions);

      setEmail("");
      setPassword("");

      // redirect to home
      window.location.href = "/";
    }
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-start justify-center gap-4 bg-zinc-900 p-8 text-zinc-100 lg:p-12">
        <div className="space-y-2">
          <h1 className="flex gap-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to{" "}
            <span className="flex gap-2 font-extrabold text-cyan-400">
              <IconLink className="h-12 w-12" />
              link2it
            </span>
          </h1>
          <p className="text-lg">
            Unlock the power of our cutting-edge tools and services. Sign in to
            get started.
          </p>
        </div>
      </div>
      <div className="relative flex items-center justify-center bg-zinc-100 p-8 text-zinc-900 lg:p-12">
        <div className="absolute left-0 top-0 p-4">
          <Link href={"/"}>
            <Button variant={"outline"} className="text-zinc-100">Back</Button>
          </Link>
        </div>
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Sign in to your account</h2>
            <p className="text-zinc-900">
              Enter your email and password to access your account.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter your email"
                className="text-zinc-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="text-zinc-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              variant={"outline"}
              className="w-full text-zinc-100"
              onClick={() => credSignIn()}
            >
              Sign in
            </Button>
            <Separator />
            <p className="">Or sign in with</p>

            {filteredProviders.map((provider) => (
              <div key={provider.name}>
                <Button
                  variant="outline"
                  className="flex w-full text-zinc-100"
                  onClick={() => signIn(provider.id)}
                >
                  {provider.icon && (
                    <div className="mr-2 h-4 w-4">{provider.icon}</div>
                  )}
                  Sign in with {provider.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
