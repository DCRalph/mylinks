/**
 * Runs once when the Next.js server starts, before it serves requests. Deploys
 * are a push to main, so this is where schema changes get applied.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // `next build` loads this too; only touch the database at runtime.
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { runMigrations } = await import("~/server/migrations");
  await runMigrations();
}
