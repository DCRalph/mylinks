import { useSession } from "next-auth/react";

import { api } from "~/utils/api";

export default function Dashboard() {
  const { data: sessionData } = useSession();

  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Unauthenticated</div>;
  }

  return (
    <></>
  );
}
