#!/usr/bin/env bash
# Production deploy: pull, install, migrate, build, restart. Needs bun on the server.
set -euo pipefail

# Fail before touching the running site if the box isn't ready.
command -v bun >/dev/null || { echo "bun is not installed"; exit 1; }
for var in DATABASE_URL BETTER_AUTH_SECRET NEXT_PUBLIC_DOMAINS; do
  grep -q "^${var}=" .env || { echo "Missing ${var} in .env (see .env.example)"; exit 1; }
done

echo "Stopping the server"
sudo systemctl stop startlink

echo "Pulling latest changes"
git pull

echo "Installing dependencies (also runs prisma generate)"
bun install --frozen-lockfile

echo "Migrating the database"
# One-time NextAuth -> better-auth conversion; a no-op once applied.
bunx prisma db execute --file prisma/sql/migrate-to-better-auth.sql
bunx prisma db push

echo "Building"
sudo rm -rf .next
bun run build

echo "Starting the server"
sudo systemctl start startlink
