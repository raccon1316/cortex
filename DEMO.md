# DEMO.md — AgencyOS live walkthrough (hackathon / stakeholder demo)

> Companion to the Part E demo agency ("AgencyOS Demo (sample data)").
> No secrets in this file: login details say *where* to find credentials,
> never what they are.

## The 30-second pitch

Agencies run client work across inboxes, chats, and spreadsheets — requests go
stale, decisions get lost, and nobody can answer "which client needs attention
right now?" AgencyOS is a multi-tenant client-operations system: every request,
decision, follow-up, risk, and delivery lives in one place behind
row-level-secured Postgres, each client gets a **live health score**
(0–100, computed server-side from overdue load, risk exposure, decision
latency, and request density) so the answer is always one glance away, and
every request is a **collaboration page** with a comment thread, decision
chain, and one-click status. Free and Pro plans are enforced in the database —
upgrading is self-serve Stripe Checkout when configured.

## Login

- Open the app, sign in as `demo@agencyos.example.com`.
- Password: the value printed **once** by `npm run seed:demo`, kept in the
  operator's local `.env.local` as `DEMO_TEST_PASSWORD`. If lost, reset it in
  Supabase dashboard → Authentication → Users → demo user → update password.
- If the demo data ever gets messy from live clicking: `npm run seed:demo --
  --reset` wipes and reseeds it to the known-good state — note this also
  recreates the demo user, so a **new** password is printed (save it again).

## Click-through (about 5 minutes)

**1. Command Center — start with the problem (1 min).**
Land on `/`. Point at the three client cards: Harbor Video **34 red**,
Brightline **73 yellow**, Northwind **97 green**. Say: "three clients, three
temperatures — every number on this screen is computed live from the database,
not typed in."

**2. Harbor Video — the red story (1.5 min).**
Click the Harbor card. Walk the detail page: 3 open requests, the overdue
follow-ups ("Confirm shoot location", "Music licensing"), the overdue rough-cut
delivery, 2 high/high risks. Say: "this is what a client sliding looks like —
everything late, everything risky, score 34."

**3. Waiting-On — the triage view (30 s).**
Open Waiting-On from the header. Pending follow-ups grouped by client,
earliest-due first, overdue rows flagged red. Click one row's Open link to show
it jumps to the related entity.

**4. Contrast — Northwind at 97 (30 s).**
Back to Command Center, open Northwind. Same layout, nothing on fire. Say:
"same schema, same scoring function — the score is earned, not assigned."

**5. Weekly Review — the process story (1 min).**
Open Weekly Review from the sidebar. Show the live sections (overdue, upcoming
deliveries, new items, risk changes, health shifts — all "baseline" on a fresh
seed). Click **Generate & save this review**, open it from Past reviews: "every
review is frozen as JSON — next week's diffs compute against it."

**6. Request detail — the collaboration story (1 min).**
From Requests, open any request. Point at the status chips, the
Decision / Delivery / Follow-ups columns, and post a comment — it appears
instantly for the whole team. Flip the status with the inline selector and
watch the dashboard reflect it. Say: "requests aren't spreadsheet rows —
they're the conversation."

**7. Settings — the admin story (1 min).**
Open Settings in the sidebar. Show Team: roles (changeable by owners only —
the database enforces it, the UI just tells you), member removal, and the
invite list with copy-link / send-email / revoke. Then Profile: password
change. Forgot-password lives right on the login page.

**8. Monetization — the business story (30 s).**
Still in Settings: the plan card shows Free's caps (3 clients / 2 seats) with
the upgrade path to `/pricing`. Say: "limits are enforced by Postgres
triggers, not JavaScript — a modified client can no more bypass the paywall
than it can bypass row-level security." With Stripe keys configured, the
upgrade button opens real Checkout and the webhook flips the plan.

**9. Global search — the speed story (30 s).**
Press **Cmd/Ctrl+K** anywhere (or use the sidebar Search button). Type
"final" — the request appears grouped under Requests with its client. Click
it: you land on the request page. Say: "everything in the agency, one
keystroke away — full-text search runs in Postgres, scoped to your tenant."

**10. Activity — the audit story (30 s).**
Scroll the request page to **Activity**: every create, decision, and status
change is recorded by database triggers — who did what, and when. The same
feed exists on every client and project page and on the Command Center.
**11. Climax (optional, mutates demo data) — move the score live.**
On Harbor's detail page, pick an open request → **Log decision** → status
approved + one-line rationale → submit. The request flips to approved and the
client score recomputes on load (expect low-to-mid 40s, up from 34 — new
zero-day decision pulls latency down and closes an open request). Say: "the
score isn't a dashboard trick — resolving work moves it." Reset afterwards
(see Login section) if you want the pristine 34 back.

## Real vs. simplified for v1 (the honest paragraph)

Fully real and tested: Supabase Auth, row-level security on all 14 tables
(150+-check harness plus live attack tests), invite-token onboarding with
revoke/email, Postgres health scoring, snapshots with week-over-week diffs,
request detail pages with comment threads, team/role/invite management,
settings + password reset, app-wide navigation shell, delete-with-confirm on
every entity, and database-enforced plan limits with Stripe Checkout + webhook
activation — the core flows exercised end-to-end in a real browser (12
automated Playwright tests). Simplified for v1: no realtime pushes (comment
posts refresh the server-rendered page), print-dialog export instead of PDF
generation, usable-but-not-bespoke phone layouts, and email sending is
optional (copy-link invites always work; Resend integration activates with a
key). Nothing on screen is hardcoded or stubbed; the only env-optional
behaviors (Stripe, invite email) state their unconfigured state honestly.
