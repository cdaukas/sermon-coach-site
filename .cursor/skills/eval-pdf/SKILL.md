---
name: eval-pdf
description: >-
  Generate a full-color evaluation PDF locally via Puppeteer. Use when Chris
  asks to run pdf:eval, capture pdf auth cookies, export an evaluation report
  to PDF, or troubleshoot evaluation PDF generation.
---

# Evaluation PDF export

Local-only workflow. Renders a completed evaluation page through headless Chrome.

## Prerequisites

1. `npm run dev` running (default `http://localhost:3000`)
2. `.pdf-auth-cookies.json` at repo root (from `npm run pdf:auth-cookies`; expires ~1 hour)

## Workflow

```bash
# 1. Capture session (headed browser — sign in when prompted)
npm run pdf:auth-cookies

# 2. Render PDF
npm run pdf:eval -- <evaluationId> <sermonId>

# Optional env
PDF_PREPARED_FOR="Pastor Name" PDF_COVER_VARIANT=theirs|mine npm run pdf:eval -- ...
PDF_PREACHER="Preacher Name" npm run pdf:eval -- ...
PDF_BASE_URL=http://localhost:3000 npm run pdf:auth-cookies
```

Output: `output/eval-pdf/<evaluationId>.pdf`

Scripts: `scripts/capture-pdf-auth-cookies.mts`, `scripts/generate-eval-pdf.mts`

## Troubleshooting

### Auth cookies expired or missing

`pdf:eval` reads `.pdf-auth-cookies.json` only — it does not call Supabase Auth. Re-run:

```bash
npm run pdf:auth-cookies
```

### Redirected to login / "cookies invalid"

Same fix: fresh `npm run pdf:auth-cookies`. Confirm `npm run dev` is up and the headed window reaches `/dashboard` (not stuck on login).

### Cloudflare Turnstile challenge during `pdf:auth-cookies`

When Supabase CAPTCHA is enabled, login shows a Turnstile widget (usually invisible in managed mode; may appear as a brief Cloudflare challenge on `/login`).

**This is expected.** Complete the challenge in the headed browser window, finish sign-in, then wait for the script to save cookies. There is no programmatic bypass — the script intentionally uses a real browser session.

If the script times out waiting for `/dashboard`:

1. Check the headed window for a Turnstile checkbox or "Verify you are human" interstitial.
2. Complete it, then sign in normally.
3. Re-run `npm run pdf:auth-cookies` if the browser already closed.

Turnstile does **not** affect `pdf:eval` once valid cookies exist.

### `pdf:eval` works but PDF is blank or missing sections

Confirm the evaluation row is `complete` and the URL loads in a normal browser with the same cookies. Check `evaluation-print.css` and `?pdf=1` capture mode in `EvaluationPdfCapture.tsx`.
