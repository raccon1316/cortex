<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AgencyOS project conventions

## Commands (run before finishing any task)
- `npm run lint` — must be warning-free.
- `npm run typecheck` — `tsc --noEmit`, must pass.
- `npm run verify:rls` — RLS + constraint suite, must end `ALL CHECKS PASSED`.
- `npm run build` — for anything touching app/ or lib/.

## Hard rules
- Every user-facing query goes through `lib/supabase/client.ts` (browser) or
  `lib/supabase/server.ts` (server). RLS is the tenant boundary — never filter
  by `agency_id` manually in application code.
- `lib/supabase/admin.ts` (service-role key) is server-only, admin-only. Never
  import it from a Client Component or any user-facing path.
- Migrations are append-only: never edit an applied migration; add a new file
  under `supabase/migrations/` and extend `scripts/verify-rls.mjs` for new
  tables/policies.
- `proxy.ts` refreshes sessions, but every page/action/handler that touches
  private data must still validate the user itself (getClaims/getUser).

## Deferred features (flagged, don't fabricate)
- **`mention` notifications are NOT implemented.** They need a mention parser
  first (parse `@name` from `request_comments.body`, resolve it to an
  agency_member, only then create the notification). Wiring a naive string
  match would create false-positive pings. `new_request` IS implemented
  (requests.assignee_id, migration 20260927000008).
