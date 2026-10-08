import AppShell from "~/components/Shell/AppShell";
import { requireSession } from "~/server/guards";

/** Signed-in area: everyone here has an account and a username. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = await requireSession();

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }}
      impersonating={!!session.impersonatedBy}
    >
      {children}
    </AppShell>
  );
}
