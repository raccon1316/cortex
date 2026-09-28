# AgencyOS — SaaS

Multi-tenant client-operations platform for agencies: Next.js 16 (App Router)
+ Supabase (Postgres with Row-Level Security).

**Current status: Part F complete** — auth (invite-token model + bootstrap),
Client Command Center with live health scores, full 8-entity CRUD, Waiting-On /
Request / Project dashboards, request detail pages with comment threads,
Weekly Reviews with snapshots, SOP library with read views and review dates,
team management (roles, removal, invite list/revoke/email), agency settings,
password reset, an app-wide navigation shell, and **monetization**: free/pro
plans with database-enforced free-tier limits plus Stripe Checkout + webhook
self-serve upgrades. See Setup below; billing/email features activate when
their env vars are set.

## Setup

Prerequisites: Node 20+, and a Supabase project (hosted, or local via the CLI).

```bash
npm install
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push          # applies supabase/migrations/ to the hosted DB
```

Copy `.env.example` → `.env.local` and fill in values from Project Settings →
Data API:

| Var | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | new-style key name (preferred) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | legacy alias, still accepted |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | bypasses RLS; used only by `lib/supabase/admin.ts` |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` | server-only | optional — enables self-serve Pro upgrades (`/pricing` + `/api/billing/*`) |
| `RESEND_API_KEY` / `EMAIL_FROM` | server-only | optional — enables invite emails (copy-link fallback without) |
| `DIGEST_CRON_SECRET` | server-only | optional — auth for the Monday weekly-digest sender (see CRON.md) |
| `PG_TEST_URL` | optional | test harness only — see Verification below |

```bash
npm run dev        # http://localhost:3000
```

The root page shows an honest local-setup status (env configured? setup steps)
until the project is linked and `.env.local` exists.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` / `npm run start` | production build / serve |
| `npm run lint` | ESLint (next core-web-vitals + TS) — must be warning-free |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:rls` | RLS + constraint suite (16 checks) against a fresh DB |

## Security model (read before writing app code)

- **Tenancy:** every tenant-scoped row carries `agency_id`. A caller may touch
  a row only if `agency_members` links `auth.uid()` to that agency — enforced
  by RLS via `public.is_agency_member(agency_id)`. `anon` is default-deny;
  `service_role` bypasses RLS by design (server-only).
- **App code must not filter by `agency_id` manually.** Query through
  `lib/supabase/client.ts` (browser) or `lib/supabase/server.ts` (server) with
  the publishable key; RLS is the tenant boundary. Manual filters would
  silently mask an RLS regression.
- **`lib/supabase/admin.ts`** is the only service-role entry point: server-only,
  admin-only (webhooks, bootstrap transactions). It throws if imported on the
  client. Never use it in user-facing code paths.
- **Defense in depth:** tenant-consistency triggers (`enforce_*_agency`) reject
  cross-agency parent links that RLS alone cannot see.

## Search, activity log, digest, export

- **Global search** — Cmd/Ctrl+K (or the sidebar button) opens a command
  palette over all entities, backed by Postgres tsvector columns + GIN
  indexes and the `search_agency()` function (tenant-scoped by an explicit
  agency parameter; verified by T19).
- **Activity log** — every entity create/update/delete/status-change is
  audited by database triggers into `activity_log` (append-only: no
  UPDATE/DELETE policy exists, so no user session can rewrite history).
  Feeds render on the Command Center, client, project, and request pages.
- **Weekly email digest** — `POST /api/digest/weekly` (shared-secret cron
  route, see CRON.md) emails opted-in members a Monday summary; the per-user
  opt-out lives in Settings → Profile.
- **Export** — CSV download for every entity at `/api/export/<entity>`
  (optionally `?clientId=`-scoped), plus print/PDF stylesheets on the Weekly
  Review and the client brief.

## Plans & billing

`agencies.plan` is `free` (3 clients, 2 team seats) or `pro` (unlimited). The
limits are enforced **in the database** (triggers in
`20260926000000_monetization_collab.sql`), so no client — and no join path,
including the SECURITY DEFINER invite redemption — can bypass them. Plan and
Stripe columns are guarded by a trigger that rejects changes from user
sessions: only the Stripe webhook (service role) may flip a plan.

To activate self-serve upgrades: set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`
(a recurring price), and `STRIPE_WEBHOOK_SECRET`; point a Stripe webhook at
`/api/billing/webhook` (events: `checkout.session.completed`,
`customer.subscription.*`). Without keys, `/pricing` explains that checkout
isn't enabled and everything else keeps working.

## Verification harness

`npm run verify:rls` applies every file in `supabase/migrations/` to a fresh
database and proves T0–T18: cross-tenant SELECT/INSERT/UPDATE blocked, requests
exactly-one-of constraint, decision rationale rule, FK integrity, cross-agency
parent rejection, per-table scoping, owner-guard enforcement, free-plan limits
and billing-column lock, managed member removal, and `request_comments`
tenancy.

- **Default backend: PGlite** — real Postgres 17 compiled to WASM, in-process.
  No network, no credentials, fresh throwaway DB every run. The backend in use
  is **printed at the start of every run**, so any report can state which
  engine the checks ran against.
- **Optional backend:** set `PG_TEST_URL` to a real, *empty* Postgres (e.g. a
  throwaway Docker container) to run the identical suite through the `pg`
  driver. The URL is printed with the password masked. Never point it at a
  live/shared database — the harness creates roles and applies migrations from
  scratch.

## Demo seed

`npm run seed:demo` creates the persistent **"AgencyOS Demo (sample data)"**
agency: 3 clients at three pressure levels, projects, and a multi-week spread
of dated requests/decisions/follow-ups/risks/deliveries, plus a pre-confirmed
demo login (`demo@agencyos.example.com`). Health scores are computed live by
`client_health_scores()` — the script asserts a green/yellow/red banding.
The generated password prints **once** to stdout and is stored nowhere; if
lost, reset it via Supabase dashboard → Authentication → Users.

- Without flags the script **refuses** if the demo agency exists (no duplicates).
- `npm run seed:demo -- --reset` wipes the demo agency (cascade) + recreates
  the demo user, then seeds fresh. Service-role is used for seeding only
  (devops tool, same category as migrations — never app code).

## Project layout

```
app/                  Next.js App Router (currently the setup-status landing page)
lib/supabase/
  client.ts           browser client (publishable key, RLS-respecting)
  server.ts           server client (publishable key, per-request)
  middleware.ts       session-refresh helper (called by proxy.ts)
  admin.ts            service-role client (server-only, admin-only)
scripts/verify-rls.mjs  the RLS test suite
supabase/migrations/  append-only SQL migrations (schema → rls → grants)
supabase/config.toml  Supabase CLI config
proxy.ts              Next.js 16 session-refresh entry point
```

## Migrations

Append-only. Never edit an applied migration in place; add a new timestamped
file (`npx supabase migration new <name>`). After changing migrations, run
`npm run verify:rls` and extend the suite for any new tables/policies.