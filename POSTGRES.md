# PostgreSQL support (v47)

The app now runs on **either SQLite or PostgreSQL with zero code changes**.
The build picks the right database automatically from `DATABASE_URL`:

| DATABASE_URL | Database used |
| --- | --- |
| `file:/home/z/my-project/db/custom.db` | SQLite (current default — unchanged) |
| `postgres://user:pass@host/db?sslmode=require` | PostgreSQL |

All app code, API routes and login logic are identical — Prisma hides the
difference. The MPIN verifier, owner password hash, products, bills, staff
accounts and sessions are ordinary rows and migrate as-is.

## Move to PostgreSQL — 3 steps

1. **Get a Postgres database URL.** Any managed provider works — for example
   [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both have
   free tiers). Copy the connection string, e.g.
   `postgres://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`.
2. **Set `DATABASE_URL` to that URL** in the platform's environment variables
   (the same place the app reads its other env vars), then redeploy. The
   build detects `postgres://…` and generates the PostgreSQL client
   automatically; `npx prisma db push` creates all tables on first run
   (run it once locally with the same URL, or the app creates what it needs).
3. **Carry the data over** (run from the repo, in this order):
   ```bash
   # a) dump every table from the current SQLite database
   DATABASE_URL=file:./db/custom.db node scripts/migrate-sqlite-to-postgres.mjs dump

   # b) push the schema to Postgres
   DATABASE_URL=postgres://… npx prisma db push

   # c) import the dump (same ids — login works immediately, nothing to re-register)
   DATABASE_URL=postgres://… node scripts/migrate-sqlite-to-postgres.mjs import
   ```

The import is idempotent (safe to re-run) and never overwrites rows that
already exist in the target.

## Why the current SQLite data is safe

`db/custom.db` has survived every deploy so far (the MPIN salt on the live
server is unchanged since the first login). PostgreSQL adds an extra safety
net: the database lives on the provider's infrastructure (backups, uptime),
not inside the app container.

## Firebase?

Firebase (Firestore / Firebase Auth) was considered but is **not a drop-in**:

1. It needs **your** Firebase project credentials (apiKey, authDomain,
   projectId…) — creating a Firebase project requires your Google account.
2. Firestore is a document store; the app's logic (relational tables, the
   atomic bill-number counter, session tokens with FK cascades, tombstones,
   unique verification codes) would need a full server-side rewrite, and
   Firebase Auth would replace the MPIN/staff password model entirely.

If you create a Firebase project and share its config, the auth layer can be
adapted — but PostgreSQL gives the same "always-safe storage" goal with the
code we already have, so it is the recommended path.
