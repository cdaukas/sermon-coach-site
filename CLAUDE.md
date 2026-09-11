@AGENTS.md

# The Sermon Coach — development briefing

Persistent context for Claude Code sessions in this repository. Read this before
touching code. It describes what the product is, how it is built, what is
authoritative, and how to work here safely.

---

## 1. Project identity

**The Sermon Coach** is a web product for preachers who take the craft seriously.
Its live homepage states the promise plainly: *"Walk into Sunday knowing your
sermon is ready."*

The core purpose is continuous preaching development. Evaluation is one
component of that development system.

The strategic direction of the product is to establish Sermon Coach as a system
for continuous preaching development, built around the Sermon Coach Expositional
Framework.

This distinction matters and should be preserved in code, copy, and product
decisions:

- **Evaluation is a component, not the product.** A structured evaluation of a
  single sermon is one artifact the system produces.
- **The product is a continuous development system.** The repository reflects
  this: growth reports and growth trends across sermons (`src/lib/growth/`,
  `src/lib/evaluation/growth-report.ts`, `growth-trend.ts`, `growth-edge.ts`),
  a coaching narrative layer (`coaching-report.ts`, `runCoachingNarrative.ts`),
  a "How It Preaches" read (`hip-*.ts`, `runHowItPreaches.ts`), pre-preach
  Sketch work (`src/lib/sketch/`), and a mentoring lane where one preacher
  develops another.
- A preacher's trajectory over many sermons is the thing being served. A single
  score is a waypoint in that trajectory.

**The Expositional Framework** is the standard underneath that development. It
is the evaluative rubric the system applies — drawn, per the skill's own
description, from Bryan Chapell (Fallen Condition Focus, redemptive arc), the
Simeon Trust workshop method (textual fidelity, melodic line), Desiring God /
Piper (gospel clarity, expository exultation), and 9Marks (ecclesial
faithfulness). It supplies the shared vocabulary that makes growth measurable
across sermons rather than impressionistic.

Naming note: the public name **"Expositional Framework™"** currently appears
only in `public/how-its-scored.html`. The codebase refers to criteria, score
bands, and the rubric by their internal names. Do not rename code identifiers to
match the marketing string without explicit instruction.

---

## 2. Product architecture

**Stack:** Next.js **16.2.6** (App Router), React 19.2.4, TypeScript, Tailwind
CSS v4, deployed on Vercel. See `AGENTS.md` — this Next version has breaking
changes; read `node_modules/next/dist/docs/` before writing framework code.

### Two surfaces

| Surface | Where | Notes |
|---|---|---|
| **Marketing pages** | Static HTML in `public/` | 7 root pages — `pricing.html`, `faq.html`, `how-its-scored.html`, `story.html`, `why-sermon-coach.html`, `privacy.html`, `terms.html` — plus `blog/` |
| **Homepage and product app** | `src/app/` | The homepage is a React route at `src/app/page.tsx`. Authenticated dashboard and product routes live alongside it. |

The homepage is React. `public/index.html` no longer exists; the static page it
held was replaced by `src/app/page.tsx` (see §3). The rest of the marketing site
is still hand-written HTML, so copy can still drift between the two.

### Major product surfaces

- `/dashboard` — home, sermons list, sermon detail, evaluation dashboard
  (`/dashboard/sermons/[id]/evaluations/[evaluationId]`)
- `/dashboard/growth` — growth report across sermons
- `/dashboard/sketch`, `/dashboard/sketches` — pre-preach Sketch
- `/dashboard/develop`, `/dashboard/mentoring` — Mentoring lane (see §5)
- `/dashboard/buy`, `/dashboard/account` — plans and billing management
- `/start`, `/invite/[token]`, `/mentor/*` — onboarding, invitations, acceptance
- `/sample-evaluation`, `/sample-sketch`, `/sample-debrief` — public samples
- `/sketch` — the public Free Outline Check, no account required. The nav links
  to it as **Sketch — Free**
- `/` — the homepage (see §3)

### Authentication

Supabase Auth via `@supabase/ssr`. Routes under `src/app/(auth)/` (login,
signup, reset-password, update-password) plus `/auth/callback` and
`/auth/confirm`. Helpers in `src/lib/auth/` and `src/lib/supabase/`.

Historical note carried forward from prior handoff docs: the `auth.getUser()`
prewarm in the dashboard layout was described as load-bearing. Verify current
code before altering auth timing.

### Supabase / database

Postgres via Supabase. **94 migrations** in `supabase/migrations/`. Core tables
include `profiles`, `sermons`, `sermon_versions`, and `sermon_evaluations`
(`result` jsonb, status, scores, tokens). RLS enforces ownership through the
`sermons` → `sermon_versions` chain. Server-only work uses the service role key.

Migrations are additive history — add new ones, do not rewrite applied ones.

### Stripe / billing

Subscriptions with checkout at `/checkout`, customer portal at
`/api/billing/portal`, and webhook handling at `/api/webhooks/stripe`. Logic in
`src/lib/billing/`. Recent work records subscription start/cancellation
timestamps and preserves Coach access while a payment is still retrying —
billing state is deliberately forgiving; do not tighten it casually.

There is a guard script: `npm run verify:billing-lock`.

### Anthropic / evaluation pipeline

`@anthropic-ai/sdk`, model set by `EVALUATION_MODEL` (`.env.example` shows
`claude-sonnet-4-6`). `EVALUATION_USE_STUB=1` enables the stub path.

Flow lives in `src/lib/evaluation/`:
`prompt.ts` → `tool-schema.ts` (Anthropic tool schema) → `runEvaluation.ts` →
Zod validation in `schema.ts` → persisted by `processEvaluation.ts`, which runs
as an async job while the client polls `/api/evaluations/[evaluationId]`.
Quotas and cooldowns in `quota.ts`. Related generators: `runHowItPreaches.ts`,
`runCoachingNarrative.ts`, `runCriterionVerdictLines.ts`.

### API routes

14 route handlers under `src/app/api/` — evaluations polling, Stripe webhook,
mentor invite email, newsletter subscribe, readiness read, sketch run/save,
YouTube transcript import, and four cron endpoints.

### Vercel / crons

`vercel.json` schedules four jobs:
`/api/cron/operator-digest` (Mon 13:00 UTC),
`/api/cron/purge-unverified-users` (Mon 14:00 UTC),
`/api/cron/tuesday-nudge` (Tue 13:00 UTC) and
`/api/cron/purge-sermons` (daily 15:00 UTC).

### External services

Supabase (auth + DB), Stripe (billing), Anthropic (evaluation), **Supadata**
(YouTube caption fetch, `SUPADATA_API_KEY`), Cloudflare Turnstile
(`@marsidev/react-turnstile`), Puppeteer (PDF generation scripts), and email
delivery (see `EMAIL_DELIVERABILITY.md` for the Resend/Postmark plan).

---

## 3. The homepage

The homepage is **`src/app/page.tsx`**, a React route. Title and meta: *"Walk
into Sunday knowing your sermon is ready."*

It began as a `/v2` draft alongside a static `public/index.html`. Both are gone:
the draft shipped to `/` and the static file was deleted. If you find a doc
referring to `/v2` or `public/index.html`, that doc is stale.

Components live in `src/components/home-v2/` (the directory kept its name),
styled by `home-v2.css` using site CSS tokens (`docs/design-tokens.md`).

Section order is deliberate, and the reasoning is in the file's own header
comment: problem → sample → standard → voice → mentoring → objection → proof →
offer.

`HomeV2Header`, `HomeV2Hero`, `HomeV2Tagline`, `HomeV2FeedbackVacuum`,
`HomeV2SampleSermon`, `HomeV2Framework`, `HomeV2Velasquez`,
`HomeV2DevelopOthers`, `HomeV2AiAndPreaching`, `HomeV2Proof`, `HomeV2StartFree`,
`HomeV2Footer`.

`HomeV2Newsletter` is still in the directory but is **not rendered**. Its CSS
and `/api/newsletter/subscribe` are intact; restoring it is one import and one
line.

`HomeV2SampleSermon` is the one interactive piece: a `"use client"` carousel
with no dependency, driven by arrow keys, dots and touch swipe.

**Rule:** `home-v2.css` is over 1,200 lines with breakpoints scattered through
it. At equal specificity source order decides, so a `@media` block placed
*before* the rule it overrides silently loses. This has cost a debugging round
twice. Put overrides after their base rules.

---

## 4. Expositional Framework (rubric)

### Source of truth

`SYNC.md` defines the rule. Summarized:

- **Authoritative:** `.claude/skills/sermon-coach/SKILL.md` (in this repo). Chris
  designs the rubric in chat; the skill file is the design surface.
- **Mirror:** `~/.claude/skills/user/sermon-coach/SKILL.md` — must be kept
  identical to the repo copy.
- **Derived:** `src/lib/evaluation/rubric.md` — a build-time copy read by
  `prompt.ts` at runtime. Its header says *"GENERATED FROM SKILL.md — DO NOT EDIT
  DIRECTLY."*

**Never edit `rubric.md` directly.** To change the rubric: edit the repo
`SKILL.md`, sync the Claude Code copy, paste into `rubric.md` preserving the
comment block, and commit as `sync rubric from SKILL.md @ YYYY-MM-DD`. If schema
constraints change, update `SCHEMA_SPEC.md` and `tool-schema.ts` in the same PR.

`SCHEMA_SPEC.md` is the production schema specification and names the same
canonical source.

### Criteria

Eleven canonical criterion names are locked in
`src/lib/evaluation/tool-schema.ts` (`CANONICAL_CRITERION_NAMES`) and grouped
into four categories. Ids are authoritative; historical label changes are handled
by aliases in `criterion-names.ts`. Do not rename or reorder criteria as a
refactor.

### Scoring and grading bands

- Internal scoring is a **weighted /55** value. This is what is stored and
  reasoned about.
- **10-point display is a derived view.** `display-score.ts` converts:
  `toDisplayScore(weighted55) = round((weighted55 / 5.5) * 10) / 10`.
- Bands are defined once in `schema.ts` as `SCORE_BAND_DEFINITIONS`, on /55
  thresholds: **Exemplary** ≥47, **Strong** ≥39, **Faithful** ≥30, **Needs
  Improvement** ≥22, and **Significant Concerns** below 22.
  `buildGradingBandTableRows()` derives both the /55 and /10 columns of the
  methodology table from those definitions so the UI cannot drift from computed
  scores.
- Display surfaces show the **band only**. Tier ranks and legacy letter prefixes
  are stripped on read and never re-appended (`formatStoredScoreBandForDisplay`).
  Letters/tiers remain for the methodology appendix and internal callers only.

Do not adjust thresholds, weights, or the display conversion as a "fix." Those
are methodology decisions requiring explicit approval.

---

## 5. Mentoring / develop-others

Current state is the ledger: what is open, decided, and closed. It is in this
repo, at **`claude/ledger.md`**, with the open-items board alongside it at
**`claude/board-v2.html`**. Read them before asking Chris or guessing; the board
carries dated decisions with the reasoning and the rejected alternatives. Both
were last updated 5 September 2026, so check the date against the code.

`docs/develop-others-canon.md` is reference: the shape of the Mentoring
lane, terminology, routing, schema. It does not track state.

Key points from that reference:

- User-facing product name and rail item are **Mentoring**, under a
  Developing others group. Teams, Preaching Lab, and Classroom become their
  own rail items under that header, not tabs on one page. "Develop others"
  is an internal lane name only. Do not rename the file, the
  `/dashboard/develop` route, or database identifiers to match display
  copy. Do not rename the rail item back to Develop others.
- Mentors self-serve; mentees are invited and never self-serve.
- Seat display names and database values differ. `seat_type` stays `debrief` or
  `evaluation`; UI copy uses **Apprentice** and **Colleague**. The single mapping
  lives in `src/lib/mentor/seat-labels.ts` (`mentorSeatDisplayName`). Do not
  create a second map.
- Apprentice (`debrief`, $12/mo, 2 submissions/mo) is the same machine as
  Colleague (`evaluation`, $25/mo, 4 submissions/mo) with the evaluation half
  **held**, not skipped. The hold is a `released_to_mentee_at` timestamp on the
  evaluation row — not a flag that prevents an evaluation from running.
- Mentors hold 1–4 seats; the cap is enforced.

**Evaluation vs. development in this lane:** the mentee always receives the
developmental artifact (debrief plus How It Preaches). The scored evaluation is
what a mentor releases when it will help. This is the clearest expression of the
product thesis — the score serves formation, and its timing is a pedagogical
choice.

**Files to understand:** `src/lib/mentor/` (`seat-labels.ts`, `invite.ts`,
`relationship.ts`, `relationships.ts`, `release.ts`, `allotment.ts`,
`capacity.ts`, `submissions.ts`, `uiAccess.ts`), `src/components/mentor/`,
routes `/dashboard/develop`, `/dashboard/mentoring`, `/mentor/*`,
`/invite/[token]`.

---

## 6. Development rules

1. **Inspect before modifying.** Read the actual file and its neighbors. This
   codebase has deliberate, non-obvious decisions; assume intent behind what
   looks odd.
2. **No broad architectural changes without explaining first.** Describe the
   change and get agreement before restructuring modules, data flow, or schema.
3. **Preserve existing functionality.** Behavior changes must be requested, not
   incidental.
4. **Prefer small, reversible changes.** One concern per change.
5. **Do not modify product methodology without explicit approval** — rubric
   content, criteria, weights, band thresholds, score conversion, seat rules,
   pricing, quotas.
6. **Never edit a derived file when an authoritative source exists.** Chiefly
   `rubric.md` (derived from `SKILL.md`), and any place a single mapping is
   declared canonical.
7. **Do not replace a working system because another approach seems cleaner.**
   Static marketing HTML, the polling evaluation job, the `/55` internal score —
   these are choices, not accidents.
8. **Verify after meaningful changes:** `npm run test:unit` (380 tests, 132
   suites today),
   `npx tsc --noEmit` for type safety, `npm run lint`, and `npm run build` when
   the change could affect the build.
9. **No unrelated cleanup.** Do not reformat, rename, prune branches, or fix
   nearby nits while working a task. Mention them instead.
10. **Report exactly what changed and why**, file by file.

---

## 7. Git / branching

- **`main`** is the trunk. GitHub is the source of truth:
  `github.com/cdaukas/sermon-coach-site`.
- Work happens on short-lived topic branches merged into `main` via PR, squash
  merged. Branch names follow themes (`copy/…`, `chore/…`, `build/…`, `docs/…`,
  feature slugs).
- Because merges are squashed, a merged topic branch is never an ancestor of
  `main`. `git pull` on a local branch that still holds those commits reports
  divergence; the fix is to reset the local branch to `origin/main`, not to
  merge.
- Local branches accumulate. They are noise, not garbage to clear on your own
  initiative.

Rules:

- **Run `git status` before making changes** and read the result.
- **Do not commit or push unless explicitly instructed.**
- **Do not switch branches, reset, revert, rebase, stash, or delete branches
  without explicit approval.**
- **Preserve uncommitted work.** Never discard or overwrite working-tree changes
  to make an operation succeed. If uncommitted changes are in the way, stop and
  say so.

---

## 8. Documentation map

**Authoritative**
- `claude/ledger.md` — the working ledger: what is open, decided, and closed.
  Its "Decided, do not relitigate" table is the one to read before reopening a
  settled question.
- `claude/board-v2.html` — open items by priority, with dated decisions, the
  reasoning, and the alternatives that were rejected.
- `docs/develop-others-canon.md` — Mentoring lane reference: seats, the hold,
  terminology, routing, schema. It does not track state.
- `SYNC.md` — rubric source-of-truth rule
- `SCHEMA_SPEC.md` — production evaluation schema
- `.claude/skills/sermon-coach/SKILL.md` — the rubric itself
- `AGENTS.md` — Next 16 warning

**Useful**
- `docs/design-tokens.md` — site CSS tokens
- `docs/criterion-band-ladders.md`, `docs/rewrite-register-calibration.md`
- `docs/dashboard-design-audit.md`
- `docs/sermoncoach_homepage_mockup.html` — target for homepage-v2
- `EMAIL_DELIVERABILITY.md` — sender reputation plan
- `POST_BETA_BACKLOG.md` — backlog, dated 2026-05-31
- `README.md` — mostly create-next-app boilerplate; the YouTube transcript
  section is real and current

**Stale / historical** (self-labeled — leave in place)
- `BUILD_PLAN.md`, `STEP_6_PLAN.md`, `SESSION_HANDOFF.md`

**Stale but not labeled** — do not act on these without checking current code
- `MONDAY_START.md` — dated end of May 2026; still says to defer Stripe wiring,
  which shipped weeks ago
- `CALIBRATION_FIX_PENDING.md` — dated 2026-05-29, marked "Pending"; whether it
  shipped is unverified

Marking those two as historical is a reasonable future task, but do not edit or
delete documentation as a side effect of unrelated work.

---

## 9. Important current state

*Snapshot taken 2026-09-11. It will go stale. Verify with `git status`, a test
run, and a `grep` before relying on any number here.*

- **Branch:** `main`, clean working tree.
- **Homepage:** shipped. React at `src/app/page.tsx`. There is no `/v2` route and
  no `public/index.html`.
- **Tests:** `npm run test:unit` — 380 passing, 0 failing, 132 suites.
- **`next.config.ts`** carries `turbopack: { root: __dirname }`, and it is
  committed. The comment explains why: a stray `package-lock.json` in the home
  directory was winning workspace-root inference and making Turbopack watch every
  file under `~/`.
- **Known issues / risks:**
  - The static marketing pages and the React homepage can drift in copy and
    styling. A copy change may need to land in both.
  - Site chrome lives in 18 places, 19 counting the footer. See §12, and count
    rather than trust the number.
  - `home-v2.css` is 1,200+ lines with breakpoints scattered through it. A media
    query placed before the rule it overrides silently loses. See §3.
  - `rubric.md` can silently drift from `SKILL.md` — the sync is manual.
  - The evaluation pipeline depends on a model returning schema-valid tool
    output; malformed responses and client timeouts are documented historical
    failure modes.
- **Assumptions to avoid:** the 10-point score is not what is stored; `seat_type`
  values are not the display names; the ledger *is* in this repo; this is
  Next 16, not the Next in your training data.

---

## 10. Product / brand guardrails

- **Sermon Coach is not a sermon grader.** Do not position it as a tool that
  scores or rates sermons. Evaluation is one component of a larger continuous
  development system.
- **The organizing idea is growth over time** — across sermons, seasons, and
  relationships between preachers. Growth reports, coaching narrative, How It
  Preaches, Sketch, and Mentoring are all expressions of that, not side features.
- **The Expositional Framework is the standard that makes development possible.**
  It supplies shared vocabulary and continuity; it is not a leaderboard.
- **Attribution matters.** The framework draws on named preachers and
  institutions, and the site says the principles belong to them. Preserve
  attribution copy and `tradition_tag` values exactly.
- **The voice is a preacher talking to preachers** — serious about the craft,
  honest rather than flattering, pastoral rather than clinical. See
  `public/why-sermon-coach.html` for the stated posture on AI and preaching.
- **Do not invent factual product claims.** New marketing copy may be proposed
  when explicitly requested, but it should remain consistent with the product's
  actual capabilities, theology, brand voice, and strategic positioning.
- **Ranking language stays suppressed.** Bands are shown; tiers and letter grades
  are not surfaced. Do not reintroduce them into user-facing UI.

---

## 11. Safe working protocol

At the start of any task:

1. **Understand the request.** Restate it if it is ambiguous; ask before
   guessing when readings would produce materially different work.
2. **Inspect relevant files** before proposing or writing anything.
3. **Check `git status`** and note the branch and any uncommitted work.
4. **Identify authoritative sources** for anything touching methodology,
   Mentoring, or the rubric — and confirm you are not about to edit a derived
   file.
5. **Explain the proposed approach** when the change is significant,
   architectural, or touches product methodology. Wait for agreement.
6. **Make only the requested changes.** No opportunistic cleanup.
7. **Run appropriate checks** — unit tests, typecheck, lint, build as warranted.
8. **Report exactly what changed**: files, why, what was verified, and what was
   deliberately left alone.

---

## 12. Site chrome lives in two places

The header, nav, and footer are implemented twice. Any change to them touches
**18 surfaces**:

- `src/components/home-v2/HomeV2Header.tsx` — the React homepage at `/`.
  Mobile nav is a `"use client"` component driven by `useState`.
- 17 hand-written static HTML files — the 7 root pages in `public/` plus
  `public/blog/` (8 posts, `index.html` and `_template.html`). Each carries its
  own inline `<style>` block; there is no shared stylesheet. Mobile nav is a
  vanilla-JS listener.

`public/blog/index.html` is the one most often left out of the count. Re-count
with `grep -rl 'class="nav-link"' public/` rather than trusting this number.

The footer is a **19th** surface: `HomeV2Footer.tsx` repeats several nav labels
and does not share the header's list, so a label rename touches it too.

Rules when touching any of them:

1. Change all 17 or none. `public/blog/` is the one that gets forgotten.
2. Verify by parsing CSS rules and diffing normalized output — never by
   string matching. The blog files write `.nav-links` on a single line while
   the root pages use multi-line, so a literal-match replacement silently
   skips 9 files.
3. Spot-checking two or three files does not establish uniformity. Check all 17.
4. `why-sermon-coach.html` has drifted from the other root pages and may need
   its own handling.
5. Nav order is canonical and identical everywhere: How It's Scored,
   Free Outline Check, Blog, Pricing, FAQ, Story, Log in, Start free.

The durable fix is porting the static pages into React so there is one header.
Until then, assume every chrome change is a 17-file change.
