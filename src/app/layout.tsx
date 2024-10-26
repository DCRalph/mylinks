import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { getServerSession } from "next-auth";
import SessionProvider from "~/components/SessionProvider";

import { TRPCReactProvider } from "~/trpc/react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider } from "~/components/theme-provider";

export const metadata: Metadata = {
  title: "Link shortner",
  description: "Next level link shortner",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // const session = await getServerSession();

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body id="rootBody">
          {/* <SessionProvider session={session}> */}
        <ThemeProvider attribute="class" defaultTheme="dark">
            <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
          {/* </SessionProvider> */}
        <ToastContainer theme="dark" />
      </body>
    </html>
  );
}
