import { getSession } from "next-auth/react";
import { type GetServerSidePropsContext } from "next";
import { type Session } from "next-auth";

export const requireAuth = async (
  context: GetServerSidePropsContext,
  cb: ({session}: {session: Session}) => void,
) => {
  const session = await getSession(context);

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
