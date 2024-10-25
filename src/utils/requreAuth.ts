import { type Session } from "next-auth";
import { getServerAuthSession } from "~/server/auth";

export const requireAuth = async () => {
  const session = await getServerAuthSession();

  if (!session) {
    return false
  }

  return true;
};

export const requireAuthCB = async (
  cb: ({ session }: { session: Session }) => void,
) => {
  const session = await getServerAuthSession();

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

export const requireSpyPixel = async () => {
  const session = await getServerAuthSession();

  if (!session) {
    return false
  }

  if (session.user.admin) {
    return true;
  }

  if (session.user.spyPixel) {
    return true;
  }

  return false;
}


export const requireAuthAdmin = async () => {
  const session = await getServerAuthSession();

  if (!session) {
    return false
  }


  if (session.user.admin) {
    return true;
  }

  return false;
};


export const requireAuthAdminCB = async (
  cb: ({ session }: { session: Session }) => void,
) => {
  const session = await getServerAuthSession();

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (!session.user.admin) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return cb({ session });
};