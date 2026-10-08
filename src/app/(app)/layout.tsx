import AppShell from "~/components/Shell/AppShell";
import { requireUser } from "~/server/guards";

/** Signed-in area: everyone here has an account and a username. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        admin: user.admin,
        spyPixel: user.spyPixel,
      }}
    >
      {children}
    </AppShell>
  );
}
