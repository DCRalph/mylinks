import "server-only";

import { db } from "~/server/db";

/**
 * Schema changes, applied when the server starts (src/instrumentation.ts)
 * because a deploy is just a push to main. Every entry must be a single
 * statement that is safe to run on every boot; add new ones at the end.
 * Each takes an advisory lock so two booting instances can't race.
 */
const MIGRATIONS: { name: string; sql: string }[] = [
  {
    // NextAuth v4 -> better-auth, in place. Keeps every user, Google account
    // and bcrypt password; drops NextAuth sessions (everyone signs in again).
    name: "nextauth-to-better-auth",
    sql: `
DO $$
BEGIN
  PERFORM pg_advisory_xact_lock(424242);

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Account' AND column_name = 'provider'
  ) THEN
    RETURN;
  END IF;

  -- User: better-auth requires name and email, and stores emailVerified as a boolean.
  UPDATE "User"
  SET name = COALESCE(NULLIF(name, ''), username, split_part(email, '@', 1), 'User')
  WHERE name IS NULL OR name = '';
  UPDATE "User" SET email = id || '@no-email.invalid' WHERE email IS NULL;
  ALTER TABLE "User" ALTER COLUMN name SET NOT NULL;
  ALTER TABLE "User" ALTER COLUMN email SET NOT NULL;
  ALTER TABLE "User" ALTER COLUMN "emailVerified" TYPE BOOLEAN USING ("emailVerified" IS NOT NULL);
  ALTER TABLE "User" ALTER COLUMN "emailVerified" SET DEFAULT false;
  ALTER TABLE "User" ALTER COLUMN "emailVerified" SET NOT NULL;

  -- Account: rename columns, convert the expiry from epoch seconds, and move
  -- password logins from NextAuth's "credentials" to better-auth's "credential"
  -- (one per user).
  DELETE FROM "Account" a USING "Account" b
  WHERE a.provider = 'credentials' AND b.provider = 'credentials'
    AND a."userId" = b."userId" AND a.id < b.id;
  ALTER TABLE "Account" RENAME COLUMN provider TO "providerId";
  ALTER TABLE "Account" RENAME COLUMN "providerAccountId" TO "accountId";
  ALTER TABLE "Account" RENAME COLUMN access_token TO "accessToken";
  ALTER TABLE "Account" RENAME COLUMN refresh_token TO "refreshToken";
  ALTER TABLE "Account" RENAME COLUMN id_token TO "idToken";
  ALTER TABLE "Account" ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3);
  ALTER TABLE "Account" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
  ALTER TABLE "Account" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE "Account" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  UPDATE "Account" SET "accessTokenExpiresAt" = to_timestamp(expires_at) AT TIME ZONE 'UTC' WHERE expires_at IS NOT NULL;
  UPDATE "Account" SET "providerId" = 'credential', "accountId" = "userId" WHERE "providerId" = 'credentials';
  ALTER TABLE "Account" DROP COLUMN type, DROP COLUMN expires_at, DROP COLUMN token_type, DROP COLUMN session_state;
  ALTER INDEX IF EXISTS "Account_provider_providerAccountId_key" RENAME TO "Account_providerId_accountId_key";

  -- Session: NextAuth session cookies can't be read by better-auth, so start fresh.
  DELETE FROM "Session";
  ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO token;
  ALTER TABLE "Session" RENAME COLUMN expires TO "expiresAt";
  ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT;
  ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT;
  ALTER TABLE "Session" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE "Session" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ALTER INDEX IF EXISTS "Session_sessionToken_key" RENAME TO "Session_token_key";

  DROP TABLE IF EXISTS "VerificationToken";
END $$;`,
  },
  {
    // The rest of what `prisma db push` would do for this schema version.
    name: "better-auth-schema",
    sql: `
DO $$
BEGIN
  PERFORM pg_advisory_xact_lock(424242);

  -- A brand new database gets its tables from \`prisma db push\` instead.
  IF to_regclass('"Account"') IS NULL THEN
    RETURN;
  END IF;

  CREATE TABLE IF NOT EXISTS "Verification" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
  );
  CREATE INDEX IF NOT EXISTS "Verification_identifier_idx" ON "Verification"("identifier");
  CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
  CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
  CREATE INDEX IF NOT EXISTS "Click_linkId_idx" ON "Click"("linkId");
  CREATE INDEX IF NOT EXISTS "Click_profileId_createdAt_idx" ON "Click"("profileId", "createdAt");
  CREATE INDEX IF NOT EXISTS "Click_spyPixelId_idx" ON "Click"("spyPixelId");
  DROP INDEX IF EXISTS "Link_slug_idx";
  DROP INDEX IF EXISTS "Profile_slug_idx";

  -- Folders go with their user and their parent folder.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookmarkFolder_userId_fkey' AND confdeltype <> 'c') THEN
    ALTER TABLE "BookmarkFolder" DROP CONSTRAINT "BookmarkFolder_userId_fkey";
    ALTER TABLE "BookmarkFolder" ADD CONSTRAINT "BookmarkFolder_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookmarkFolder_parentFolderId_fkey' AND confdeltype <> 'c') THEN
    ALTER TABLE "BookmarkFolder" DROP CONSTRAINT "BookmarkFolder_parentFolderId_fkey";
    ALTER TABLE "BookmarkFolder" ADD CONSTRAINT "BookmarkFolder_parentFolderId_fkey"
      FOREIGN KEY ("parentFolderId") REFERENCES "BookmarkFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;`,
  },
  {
    // admin/spyPixel booleans become roles (src/lib/permissions.ts), plus the
    // columns better-auth's admin plugin needs and the audit log.
    name: "roles-and-audit",
    sql: `
DO $$
BEGIN
  PERFORM pg_advisory_xact_lock(424242);
  IF to_regclass('"User"') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS role TEXT;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
  ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banExpires" TIMESTAMP(3);
  ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'User' AND column_name = 'admin'
  ) THEN
    UPDATE "User" SET role = CASE
      WHEN admin THEN 'admin'
      WHEN "spyPixel" THEN 'user,pixels'
      ELSE 'user'
    END
    WHERE role IS NULL;
    ALTER TABLE "User" DROP COLUMN admin, DROP COLUMN "spyPixel";
  END IF;
  UPDATE "User" SET role = 'user' WHERE role IS NULL;
  ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'user';
  ALTER TABLE "User" ALTER COLUMN role SET NOT NULL;

  CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "details" JSONB,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
  );
  CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
  CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_actorId_fkey') THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;`,
  },
];

export async function runMigrations() {
  for (const migration of MIGRATIONS) {
    try {
      await db.$executeRawUnsafe(migration.sql);
    } catch (error) {
      console.error(`Migration "${migration.name}" failed`, error);
      // Refuse to serve on a half-known schema.
      throw error;
    }
  }
}
