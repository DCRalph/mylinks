# link2it

Short links, link-in-bio profiles, bookmarks and spy pixels. Next.js 16, tRPC,
Prisma (Postgres) and better-auth.

## Local development

```sh
bun install
cp .env.example .env          # fill in DATABASE_URL and BETTER_AUTH_SECRET
bunx prisma db push
bun dev
```

`bun run check` runs the type checker and ESLint.

## Domains

`NEXT_PUBLIC_DOMAINS` lists every origin the deployment answers on, for example
`https://link2it.xyz,https://l2.it`. On each of them:

- the whole app works, sign-in included. Sessions are per domain, so signing in
  on one domain does not sign you in on another;
- every short link (`/<slug>`), profile (`/p/<slug>`) and pixel (`/img/<slug>`)
  resolves;
- the dashboard's "Share links on" picker chooses which domain copied links use.

For Google sign-in and "Connect Google", register
`https://<domain>/api/auth/callback/google` as an authorized redirect URI for
each domain in Google Cloud. Requests on hosts that aren't listed fall back to
the first domain for auth.

Behind a reverse proxy, forward the public host (`proxy_set_header Host $host;`
or `X-Forwarded-Host`). When every listed domain is https, callback URLs are
always https even if the proxy talks plain http to the app.

## Deploying

Pushing to `main` deploys. When the server starts it applies any pending
schema changes from `src/server/migrations.ts` before serving requests (see
`src/instrumentation.ts`). New schema changes go there as statements that are
safe to run on every boot.

The first deploy of this version converts the NextAuth tables to better-auth
in place. Users, Google accounts and passwords carry over; existing sessions do
not, so everyone signs in once. Older env names still work:
`NEXTAUTH_SECRET` stands in for `BETTER_AUTH_SECRET`, and
`NEXT_PUBLIC_DOMAIN` plus `NEXT_PUBLIC_SHORT_DOMAIN` stand in for
`NEXT_PUBLIC_DOMAINS`.
