"use client";

import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { IconChevronRight, IconLink } from "@tabler/icons-react";
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
    // toast.error(
    //   "Email and password disabled. Please use google sign in",
    //   toastOptions,
    // );
    // return;

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
    <main className="flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900">
      {/* Decorative elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute left-1/3 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-12 sm:px-8 lg:px-12">
        {/* Sign In Content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 text-center">
            <h1 className="sora text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <span className="flex items-center justify-center gap-2">
                <IconLink className="h-12 w-12 text-blue-500" />
                <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  link2it
                </span>
              </span>
            </h1>
          </div>

          <div className="w-full max-w-md">
            {/* Back Button */}
            <div className="mb-4 flex">
              <Link href="/">
                <Button
                  variant="outline"
                  className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 active:translate-y-[1px]"
                >
                  <IconChevronRight className="h-4 w-4 rotate-180" />
                  Back
                </Button>
              </Link>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 backdrop-blur-md">
              <div className="mb-6 space-y-2">
                <h2 className="text-2xl font-bold text-white">Sign in</h2>
                <p className="text-zinc-400">
                  Enter your credentials to continue
                </p>
              </div>

              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    placeholder="Enter your email"
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-white placeholder-zinc-400 backdrop-blur-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  variant="default"
                  className="h-11 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-base font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-[1px]"
                  onClick={() => credSignIn()}
                >
                  Sign in
                </Button>
              </div>

              {filteredProviders.length > 0 && (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <Separator className="flex-1 bg-zinc-800" />
                    <span className="text-sm text-zinc-400">
                      or continue with
                    </span>
                    <Separator className="flex-1 bg-zinc-800" />
                  </div>

                  <div className="grid gap-3">
                    {filteredProviders.map((provider) => (
                      <Button
                        key={provider.name}
                        variant="outline"
                        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-5 py-3 text-base font-medium text-white backdrop-blur-sm transition-all hover:translate-y-[-1px] hover:border-blue-500/50 hover:bg-zinc-700/50 active:translate-y-[1px]"
                        onClick={() => signIn(provider.id)}
                      >
                        {provider.icon && (
                          <div className="mr-2 h-5 w-5">{provider.icon}</div>
                        )}
                        Sign in with {provider.name}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
