# The Sermon Coach — Build Plan

Analysis and recommended architecture for adding the product layer (auth → upload → AI → library → Stripe) on top of the existing marketing site. Captured from codebase scan, May 2026.

---

## Framework finding

**This is not a framework app.** The repo is eight hand-authored **static HTML files** at the repository root:

- No `package.json`, build step, React/Next/Astro, server code, `.env`, or `vercel.json` in the repo.
- Styling: CSS variables and layout in a `<style>` block inside each file (duplicated per page).
- Typography: system serif (`Iowan Old Style`, Georgia) plus system sans for UI chrome.
- **Hosting:** Vercel (`server: Vercel` on live responses; comments in `index.html` reference redeploying to Vercel).
- **Deploy flow:** GitHub `main` → Vercel static deploy — files served as-is from the repo root.
- **Live third-party integration:** Tally waitlist embed on the landing page only. Pricing CTAs point to `index.html#reserve`, not Stripe.

### Repo file map

| File | Role |
|------|------|
| `index.html` | Landing + sample cards + Tally waitlist |
| `pricing.html`, `faq.html` | Marketing |
| `privacy.html`, `terms.html` | Legal (written for the *future* product) |
| `sermon-evaluation-*.html` (×3) | Public sample dashboards |

---

## Publishing mechanism (public sample evaluations)

**Fully static HTML files committed to git — not dynamic, not Supabase, not a CMS.**

### Inferred workflow

1. **Generate** — Claude skill outputs a complete standalone HTML document (title, embedded CSS, full evaluation body).
2. **Commit** — Files land via GitHub “Add files via upload” commits (e.g. Tressler, Hebrews 1:1–4, Hebrews 3 revisions).
3. **Link manually** — Add a sample card on `index.html` pointing at `./sermon-evaluation-<slug>.html`.
4. **Deploy** — Push to `main`; Vercel serves `https://www.sermoncoach.online/sermon-evaluation-<slug>.html`.

There is **no** server rendering, database read, or build-time generation in this repo. Each evaluation is a self-contained ~42–74 KB HTML file with its own copy of dashboard CSS.

### Client-side behavior

- Some evaluation pages include light inline JS (accordion toggles, heat-map beat interaction).
- Footer text like “Generated from manuscript transcript” is static copy in the HTML, not proof of runtime generation on the site.

### Tony Reinke / 2 Corinthians 6

Not in this repo or on `main` at GitHub. `sermon-evaluation-reinke-2cor6.html` returns **404** on production. That page may be local-only, unpublished, or under a different filename. The manual skill → HTML process still applies; it is not in the current deployed tree.

### Current public samples (linked from `index.html`)

- `sermon-evaluation-hebrews-3.html`
- `sermon-evaluation-hebrews-1-1-4.html`
- `sermon-evaluation-tressler-2cor11-rev2.html`

---

## Supabase verdict

**Unused in this codebase.**

- Zero Supabase client code, env vars, SQL migrations, or API routes.
- The only Supabase mention is forward-looking copy in `privacy.html` (alongside Anthropic, Stripe, Vercel as planned providers).
- `terms.html` / `privacy.html` describe accounts, sermon libraries, Stripe billing, and sign-in cookies — **product spec in legal form**, not implemented behavior.

The **supabase-teal-umbrella** project and empty `sermon_evaluations` table are legacy v0 scaffolding. Safe to treat as ignorable until a real schema is designed. Reusing that Supabase project later is reasonable; the current table would need a full redesign.

---

## Bottom line

| Question | Answer |
|----------|--------|
| Framework? | **None** — plain static HTML/CSS, minimal inline JS |
| How samples publish? | **Commit static HTML to git → Vercel serves files → manual link on homepage** |
| Supabase used? | **No** in code; only mentioned in privacy policy; empty table is legacy |
| Best path for product? | **Next.js + Supabase Auth/DB + Stripe + server-side Claude**, marketing/samples stay static at current paths until deliberately migrated |

---

## Marketing vs product today

`pricing.html` already documents tiers (Coach $15 / Coach Plus $29 / Cohort $99, founding 50% off for 12 months, evaluation quotas, shareable dashboards, library). CTAs are **waitlist only**. Legal pages describe the full SaaS. **Marketing and legal are ahead of engineering** — pre-launch marketing plus static portfolio samples.

---

## Recommended architecture

### Guiding principle: two lanes

| Lane | Purpose | Keep as-is? |
|------|---------|--------------|
| **Marketing / public samples** | SEO, trust, zero auth | Yes — same URLs, same static files (at least initially) |
| **Product** | Auth, upload, AI, private library, Stripe | New stack *alongside* |

Do **not** bolt auth/API onto raw root HTML files long term. Add a real app boundary.

### Stack (aligned with `privacy.html`)

**Next.js (App Router) on Vercel** in the same repo (or sibling repo + subdomain):

- **Marketing / samples** — Existing HTML at current paths via `public/` so `sermoncoach.online/pricing.html` unchanged.
- **`/app/*`** — Authenticated product: dashboard, upload, library, billing.
- **Route handlers / server actions** — Claude API with rubric system prompt server-side only; never expose API keys to the browser.
- **Supabase** — Auth (email/password or magic link), Postgres, RLS for per-user rows, optional Storage for manuscripts/audio.
- **Stripe** — Checkout + Customer Portal + webhooks → subscription tier + monthly evaluation quota.

**Alternative:** `app.sermoncoach.online` as a separate deploy; keep this repo 100% static forever. Cleanest separation; slightly more DNS/CORS/cookie work.

### Suggested data model (replace empty `sermon_evaluations`)

- **`profiles`** — linked to `auth.users`, Stripe customer id, plan tier, founding-member flag, `evaluations_used_this_period`
- **`sermons`** — `user_id`, title, passage, source text or storage path, `created_at`
- **`evaluations`** — `sermon_id`, status (`queued` / `running` / `done` / `failed`), `html_snapshot` or structured JSON + render template, scores metadata, `is_public` (false for private library)
- **`subscriptions`** — mirror Stripe state for quotas and feature flags

Public samples today = static files **or** same HTML with `is_public` + stable slug. Easiest migration: **keep the three existing files static**; new evaluations use DB + template.

### Evaluation HTML: skill → product bridge

1. **Short term:** Store generated HTML in Supabase (or Storage); serve behind auth; optional signed share links for “shareable dashboard.”
2. **Medium term:** Extract shared CSS/components into one template; Claude returns **structured JSON** and render through that template (easier diffs, quotas, re-generation, compare drafts).

The skill output is the **canonical UI contract** (rubric sections, heat map, scoring, growth opportunities). Duplicated CSS per file is the main tech debt that made manual publishing work well.

### Phased build order

1. **Foundation** — Next app in repo, env secrets, Supabase auth + schema + RLS, Vercel preview without moving marketing URLs.
2. **Upload + queue** — Paste/upload sermon → DB row → background job calls Claude → save HTML → notify when done.
3. **Library UI** — List/filter per user; view uses same dashboard presentation as samples.
4. **Stripe** — Three products + founding coupon (50% × 12 months; cap 25 in Stripe/metadata); webhooks enforce monthly limits from `pricing.html`.
5. **Share links** — Optional unlisted public URL per evaluation (distinct from marketing samples).
6. **Marketing integration** — Replace “Reserve” with sign-in / trial when ready; keep sample section static or drive cards from `samples.json` later.

### Leave untouched (for now)

- Root-level marketing HTML paths and copy.
- The three existing `sermon-evaluation-*.html` URLs.
- Tally waitlist until Stripe + auth are live (or run both briefly).
- Legacy `sermon_evaluations` table until the real schema is designed.

### Risks to name early

- **CSS duplication** — New samples via skill + commit do not scale; product should centralize one template.
- **Evaluation cost/time** — Long Claude runs need async jobs (Vercel background functions, Inngest, or Supabase Edge + queue), not a synchronous form POST.
- **Audio/video** — Pricing mentions transcript; implies Whisper/transcription before rubric — separate pipeline stage.
- **Founding member cap (25)** — Enforce in Stripe promotion + app metadata.
- **Reinke page** — If HTML exists locally, publishing is still add file + index card + push; not in `main` today.

---

## Sensible first implementation slice

When building starts, do this first — without touching marketing pages or sample URLs:

1. Scaffold **Next.js on Vercel** in this repo (or `app.` subdomain).
2. Wire **Supabase Auth** and a minimal schema + RLS.
3. Ship one protected route: **view evaluation** — renders stored HTML for the signed-in owner.

Defer Stripe, upload UI, and Claude pipeline until auth + render path are proven.

---

## Remote / infra notes

- **Git remote:** `https://github.com/cdaukas/sermon-coach-site.git`
- **Production:** `www.sermoncoach.online` (Vercel)
- **Planned providers (legal only today):** Anthropic, Stripe, Vercel, Supabase
