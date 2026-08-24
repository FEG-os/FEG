# Household Ledger

Internal rental applicant &amp; tenant management system. See the architecture
plan (shared separately) for the full workflow, schema rationale, and
MVP/Phase 2/3 split.

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Supabase (Postgres, Auth, Storage)
- Square (payments), RentPrep (screening, manual), Dropbox Sign (e-signature)

## First-time setup

1. **Install dependencies** (already done if you're reading this after scaffold):
   ```bash
   npm install
   ```

2. **Create the Supabase project.** This needs your own Supabase login, so do
   this step yourself:
   ```bash
   supabase login
   ```
   This opens a browser to authenticate the CLI. Then either create a
   project at [supabase.com/dashboard](https://supabase.com/dashboard) and
   note its project ref, or run:
   ```bash
   supabase projects create household-ledger --org-id <your-org-id>
   ```
   (`supabase orgs list` shows your org id if you don't have it handy.)

3. **Link this repo to the project:**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

4. **Push the schema:**
   ```bash
   supabase db push
   ```
   This applies `supabase/migrations/0001_init.sql` (tables) and
   `0002_rls.sql` (row-level security policies).

5. **Generate TypeScript types** (replaces the placeholder in
   `src/lib/supabase/types.ts`):
   ```bash
   supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts
   ```

6. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in the Supabase URL/keys from Project Settings → API. Leave the
   Square and Dropbox Sign values blank until those integrations are wired
   up.

7. **Create your first staff account.** Add yourself (and your wife) as
   users in Supabase Auth (dashboard → Authentication → Users → Add user),
   then insert a matching row in `staff_users` with `role = 'owner'` for
   each of you — the app has no self-serve signup by design.

8. **Run the dev server:**
   ```bash
   npm run dev
   ```

## Project layout

- `supabase/migrations/` — schema (`0001_init.sql`) and RLS policies
  (`0002_rls.sql`), applied in order.
- `src/lib/supabase/client.ts` — browser Supabase client.
- `src/lib/supabase/server.ts` — server Supabase client (Server Components,
  Route Handlers), respects RLS as the logged-in staff user.
- `src/lib/supabase/service.ts` — service-role client. Server-only. Used by
  the applicant-facing API routes (no login) and by webhook handlers.
  Never import this from anything that ships to the browser.
# FEG
