import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";

import { type Adapter } from "next-auth/adapters";
// import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import type { User as PUser } from "@prisma/client";

import { env } from "~/env";
import { db } from "~/server/db";
import { v4 } from "uuid";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: PUser;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/signin",
  },

  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        session.user = user as PUser;
      }
      return session;
    },
    async signIn({ user }) {
      const PUser = await db.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!PUser) {
        return false;
      }

      return true;
    },
    async jwt({ token, account }) {
      // credentials provider hack
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
  },
  jwt: {
    // credentials provider hack
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = v4();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const expire = new Date();
        expire.setDate(expire.getDate() + 30);

        const createdSession = await db.session.create({
          data: {
            sessionToken,
            userId: params.token.sub,
            expires: expire,
          },
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return JSON.stringify(params.token);
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "email", type: "email", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _req) {
        if (!credentials) {
          return null;
        }

        // Add logic here to look up the user from the credentials supplied
        if (!credentials.email || !credentials.password) {
          return null;
        }

        if (credentials.password === "") {
          return null;
        }

        const user = await db.user.findFirst({
          where: {
            email: credentials.email,
            accounts: {
              some: {
                provider: "credentials",
                password: credentials.password,
              },
            },
          },
        });

        if (user) {
          return user;
        }

        return null;
      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
