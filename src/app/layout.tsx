import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider } from "~/components/theme-provider";
import SessionProvider from "~/components/SessionProvider";

export const metadata: Metadata = {
  title: "Link shortner",
  description: "Next level link shortner",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body id="rootBody">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </ThemeProvider>
        </SessionProvider>
        <ToastContainer theme="dark" />
      </body>
    </html>
  );
}
