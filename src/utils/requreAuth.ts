import { type GetServerSidePropsContext } from "next";
import { type Session } from "next-auth";
import { getServerAuthSession } from "~/server/auth";

export const requireAuth = async (
  context: GetServerSidePropsContext
) => {
  const session = await getServerAuthSession(context);

  if (!session) {
    return false
  }

  return true;
};

export const requireAuthCB = async (
  context: GetServerSidePropsContext,
  cb: ({ session }: { session: Session }) => void,
) => {
  const session = await getServerAuthSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return cb({ session });
};


export const requireAuthAdmin = async (
  context: GetServerSidePropsContext,
) => {
  const session = await getServerAuthSession(context);

  if (!session) {
    return false
  }

  if (session.user.role !== "admin") {
    return false;
  }

  return true;
};

export const requireAuthAdminCB = async (
  context: GetServerSidePropsContext,
  cb: ({ session }: { session: Session }) => void,
) => {
  const session = await getServerAuthSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (session.user.role !== "admin") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return cb({ session });
};