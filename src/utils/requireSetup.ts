import { Session } from "next-auth";
import { db } from "~/server/db";

export const checkRequireSetup = async (
  session: Session | null
) => {

  // return true

  if (!session) {
    return false;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
  })

  if (user?.requireSetup == true) {
    return true;
  }

  return false;
};