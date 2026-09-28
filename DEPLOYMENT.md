# DEPLOYMENT.md — AgencyOS to Vercel (manual steps)

> Prep doc only. Nothing here has been executed: there is no Vercel account,
> no Vercel project, and this repo has **no git remote** yet. Work through the
> steps below in order; each one says exactly where to click.

## 0. Prerequisites (on this machine)

- The repo builds cleanly: `npm run lint`, `npm run typecheck`, `npm run build`
  (all verified passing).
- `.env.local` holds the real credentials (it stays on this machine — it is
  gitignored and must never be committed).
- Install [GitHub Desktop](https://desktop.github.com/) or have `git` on PATH,
  and have a [GitHub](https://github.com/) account.

## 1. Push the repo to GitHub

1. On github.com, click **+ (top right) → New repository**. Name it
   `agencyos-saas`, leave it **Private**, do **not** tick "Add a README"
   (the repo already has files). Click **Create repository**.
2. GitHub shows a "…or push an existing repository" block. In a terminal in
   this folder, run the two commands from that block (they look like this —
   replace `YOU` with your GitHub username):
   ```bash
   git remote add origin https://github.com/YOU/agencyos-saas.git
   git push -u origin main
   ```
   When asked, sign in (use a Personal Access Token as the password if asked —
   GitHub no longer accepts account passwords: **Settings → Developer
   settings → Personal access tokens → Generate new token (classic)** with the
   `repo` scope).
3. Refresh the GitHub repo page: you should see all project files **except**
   `.env.local` (verify it is absent — if it appears, stop and fix `.gitignore`
   before continuing).

## 2. Import into Vercel

1. Go to [vercel.com](https://vercel.com/) and click **Sign Up**. Choose
   **Continue with GitHub** and authorize Vercel (this lets Vercel see your
   repos). The free Hobby plan is enough.
2. On the Vercel dashboard, click **Add New… → Project**.
3. In **Import Git Repository**, find `agencyos-saas` (use the search box if
   needed) and click **Import**.
4. On the **Configure Project** screen, leave everything at its defaults:
   - Framework Preset: **Next.js** (auto-detected — do not change it).
   - Root Directory: `./` (the repo root — do not change it).
   - Build Command / Output Directory: leave as Vercel fills them in.
   - Do **not** click Deploy yet — environment variables come first.

## 3. Set environment variables (before the first deploy)

Still on the Configure Project screen, expand **Environment Variables** and add
these three, copying the **values** from your local `.env.local` (keys must
match exactly, values are pasted verbatim):

| Key | Value source | Expose to |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Production, Preview, Development (tick all three) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Production, Preview, Development |

Notes:
- There is **no `.env` file upload** — each variable is added one row at a
  time (Name field = key, Value field = pasted secret).
- Set **exactly these three**. Do NOT add `DEMO_TEST_PASSWORD` (browser-test
  credential, local only) or `PG_TEST_URL` (throwaway-database harness
  option) — neither belongs on a deployed environment.
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix on purpose: Vercel
  only inlines `NEXT_PUBLIC_*` into browser JavaScript, so the service-role
  key stays server-side. The app never imports it in client code (verified by
  audit).
- Later changes live under the deployed project's **Settings → Environment
  Variables** (same table; remember to **Redeploy** afterwards — env edits do
  not apply retroactively).

## 4. Deploy

Click **Deploy**. Vercel builds (`npm run build`) and, after a minute or two,
shows a confetti page with a **Visit** button and a `*.vercel.app` domain.
Open it: you should see the AgencyOS landing page (or the setup-status card —
if you see the setup card on the deployed site, an env var is missing or
misspelled; check step 3).

## 5. Point Supabase Auth at the new domain (required for email links)

Password sign-in works immediately, but Supabase sends email-confirmation and
password-recovery links to its configured **Site URL** (currently localhost or
unset), so those links would point at the wrong place:

1. In the [Supabase dashboard](https://supabase.com/dashboard), open your
   project → **Authentication → URL Configuration** (left sidebar, under
   Configuration).
2. Set **Site URL** to your Vercel domain **plus the callback path**, e.g.
   `https://agencyos-saas.vercel.app/auth/callback` (no trailing slash).
   Email links (signup confirmation, recovery, OTP) must land on
   `/auth/callback`, which exchanges the code server-side and signs the user
   in — plain `/` would bounce logged-out visitors to `/login` and drop the
   code, stranding them (found by browser testing). The login page also
   handles `?code=` itself as a fallback if Site URL points at `/login`.
3. Under **Redirect URLs**, click **Add URL** and add the same domain, plus a
   wildcard for previews if you use them, e.g.
   `https://agencyos-saas*.vercel.app/**`. Click **Save**.
4. No database work is needed: all migrations are already pushed
   (`npx supabase db push` was run; the app reads the hosted schema directly).

## 6. Smoke test (5 minutes, on the deployed URL)

1. Open `/signup`, create an agency (or use an invite link at `/join?token=…`).
2. Create a client → open it from the Command Center → confirm a health score
   renders (a brand-new client scores 100).
3. Create a project + request under that client; check they appear on
   `/waiting` (if pending) and `/requests`.
4. Open `/review` → **Generate & save this review** → open it from Past
   reviews to confirm the snapshot round-trips.
5. If any step fails with a 500 or an auth error, check Vercel's
   **Deployments → (latest) → Runtime Logs**, and confirm step 3's variables
   are set for the **Production** environment.

## 7. Day-2 notes (not needed for launch)

- Each `git push` to `main` auto-deploys Production; other branches get
  Preview URLs (same env table, if ticked in step 3).
- `proxy.ts` (session refresh) runs on Vercel's default runtime with no extra
  config — nothing to set up.
- Custom domain (optional): project **Settings → Domains → Add**, then add the
  DNS records Vercel shows at your registrar. If you add one, repeat step 5
  with the custom domain.
