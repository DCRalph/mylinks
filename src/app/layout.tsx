import "~/styles/globals.css";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";
import localFont from "next/font/local";

import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

const gobold = localFont({
  src: "./fonts/gobold.woff",
  variable: "--font-gobold",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "link2it", template: "%s | link2it" },
  description: "Short links, link-in-bio profiles and bookmarks.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} ${gobold.variable}`}
    >
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
