# CRON — Weekly Email Digest

The weekly digest (overdue items, upcoming deliveries, health shifts) is sent
by `POST /api/digest/weekly`. It is a machine endpoint: it authenticates with
a shared secret, not a user session.

## Required env vars

| Var | What it is |
|---|---|
| `DIGEST_CRON_SECRET` | Any long random string. Never commit it. |
| `RESEND_API_KEY` | Resend API key. **Without it, emails are logged to the server console instead of sent** (safe dev mode). |
| `EMAIL_FROM` | Verified Resend sender, e.g. `AgencyOS <digests@yourdomain.com>`. |

## Vercel setup (UI steps)

1. Open your project on [vercel.com](https://vercel.com) → **Settings** →
   **Cron Jobs**.
2. Click **Add Cron Job**.
3. Name: `weekly-digest`
4. Schedule: `0 7 * * 1` — 07:00 UTC every Monday. (Vercel cron uses UTC;
   adjust for your agencies' timezones.)
5. Route/Path: `/api/digest/weekly`
6. Method: `POST`
7. Save. Then open **Settings → Environment Variables** and add
   `DIGEST_CRON_SECRET` (Production + Preview).

> Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically **only**
> when you set the special env var `CRON_SECRET`. Simplest setup: set
> `CRON_SECRET` to the same value as `DIGEST_CRON_SECRET` — the header then
> matches with no custom configuration.

## Test manually

```bash
curl -X POST https://your-domain.com/api/digest/weekly \
  -H "Authorization: Bearer <your DIGEST_CRON_SECRET>"
```

Expected response:

```json
{ "sent": 12, "skipped": 3, "errors": [] }
```

- `sent` — emails actually delivered via Resend.
- `skipped` — members opted out, had no real email, or Resend is not
  configured (console-log mode).
- `errors` — per-member or per-agency failures; one agency failing never
  blocks the others.

Without the header (or with the wrong secret) the endpoint answers `401`.
