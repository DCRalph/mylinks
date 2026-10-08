-- Converts the NextAuth v4 auth tables to the better-auth shape in place,
-- keeping every user, Google account and password. Run it once before
-- `prisma db push`; it is a no-op on a database that is already converted.
--
--   bunx prisma db execute --file prisma/sql/migrate-to-better-auth.sql
--
-- Existing NextAuth sessions are dropped, so everyone signs in once more.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'Account' AND column_name = 'provider'
  ) THEN
    RAISE NOTICE 'Auth tables already use the better-auth shape, nothing to do.';
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
  -- password logins from NextAuth's "credentials" to better-auth's "credential".
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
  ALTER INDEX "Account_provider_providerAccountId_key" RENAME TO "Account_providerId_accountId_key";

  -- Session: NextAuth session cookies can't be read by better-auth, so start fresh.
  DELETE FROM "Session";
  ALTER TABLE "Session" RENAME COLUMN "sessionToken" TO token;
  ALTER TABLE "Session" RENAME COLUMN expires TO "expiresAt";
  ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT;
  ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT;
  ALTER TABLE "Session" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE "Session" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  ALTER INDEX "Session_sessionToken_key" RENAME TO "Session_token_key";

  -- VerificationToken is replaced by the Verification table that `prisma db push` creates.
  DROP TABLE IF EXISTS "VerificationToken";
END $$;
