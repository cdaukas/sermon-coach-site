# Step 6 Plan: Sermon Evaluation Pipeline

**Status when this was written:** Steps 1–5 are complete on `build/product-layer`. Auth works end-to-end. Logged-in users can save sermons (`sermons` + `sermon_versions`) and view them on the dashboard. **No evaluation logic, no `profiles` table, no Anthropic dependency yet.**

**Canonical UI contract:** `public/sermon-evaluation-tressler-2cor11-rev2.html` (and the other sample HTML files). Chris referenced `sermon-evaluation-tressler-2cor11-rev3.html`; that file is not in the repo yet — treat **rev2** as the layout/section spec until rev3 is committed.

**Pricing context (quotas in code; Stripe not wired yet):** Coach $29/mo — **10 evals/mo**; Cohort $99/mo — **50 evals/mo** pooled, 5 seats. FAQ: one evaluation = one full dashboard per submission; re-running a draft counts again; subscription counters reset monthly.

---

## Plain-language summary

Step 6 is where the product becomes real: a preacher clicks **Evaluate**, waits a few minutes, and gets the same kind of dashboard they see in the marketing samples — scores, rubric breakdown, heat map, growth opportunities, top priorities, rewrites, methodology.

The build should stay **small and shippable** for a solo pre-launch developer:

1. Store each evaluation in Postgres with clear status (`pending` → `running` → `complete` / `failed`).
2. Run Claude **only on the server**, with the rubric in one version-controlled markdown file (not in the database).
3. Ask Claude for **structured JSON** (validated before save), then render with **React components** that match the sample HTML — not `dangerouslySetInnerHTML` from the model.
4. For the long wait (20–60s+), start with a **synchronous server path + loading UI** on the sermon detail page; add polling only if Vercel timeouts force it.
5. Enforce **basic cost controls** in the database before any API call (monthly cap stub, one in-flight evaluation per user, short cooldown).
6. Stripe and shareable public links are **later steps** — stub quota in `profiles` now so Step 7 doesn’t require a schema rewrite.

---

## A. Data model

### Plain language

- Add a **`sermon_evaluations`** table tied to a **specific manuscript version** (`sermon_version_id`), not just the sermon title row.
- Allow **multiple evaluation rows per version** over time (re-runs, failed retries, future rubric versions), but only **one active run** (`pending` or `running`) per version at a time.
- Store the full rubric output as **one JSON document** in Postgres; add a few scalar columns for list views and quotas (score, band, status, timestamps).
- Add a minimal **`profiles`** row per user for monthly evaluation counting (Stripe can fill tier later).

### Technical: `sermon_evaluations`

```sql
create table public.sermon_evaluations (
  id                 uuid primary key default gen_random_uuid(),
  sermon_version_id  uuid not null references public.sermon_versions (id) on delete cascade,
  status             text not null default 'pending'
                     check (status in ('pending', 'running', 'complete', 'failed')),
  error_message      text,                    -- user-safe message when failed
  model              text,                    -- e.g. claude-sonnet-4-6-20250514
  prompt_version     text not null default 'v1',  -- bump when rubric/prompt changes
  result             jsonb,                   -- canonical structured output; null until complete
  overall_score      int check (overall_score is null or (overall_score between 0 and 100)),
  score_band         text,                    -- e.g. 'B · Strong'
  input_tokens       int,
  output_tokens      int,
  created_at         timestamptz not null default now(),
  started_at         timestamptz,
  completed_at       timestamptz
);

-- Only one in-flight evaluation per version
create unique index sermon_evaluations_one_active_per_version_idx
  on public.sermon_evaluations (sermon_version_id)
  where status in ('pending', 'running');

create index sermon_evaluations_version_created_idx
  on public.sermon_evaluations (sermon_version_id, created_at desc);

create index sermon_evaluations_status_idx
  on public.sermon_evaluations (status)
  where status in ('pending', 'running');
```

**RLS** (same ownership-through-parent pattern as `sermon_versions`):

| Policy | Operation | Predicate |
|--------|-----------|-----------|
| `sermon_evaluations_select_own` | SELECT | `exists (sermons s join sermon_versions v … s.user_id = auth.uid())` |
| `sermon_evaluations_insert_own` | INSERT | same via `WITH CHECK` |
| `sermon_evaluations_update_own` | UPDATE | `USING` + `WITH CHECK` |
| `sermon_evaluations_delete_own` | DELETE | `USING` |

**Service role note:** The Claude worker may need to update rows as `running` → `complete` using the **service role** in a Route Handler (bypasses RLS). Alternative: keep everything in a single server action using the user’s session and RLS-friendly updates — simpler for v1 if timeouts allow.

### One evaluation per version, or many?

**Many rows per `sermon_version_id`, over time.**

| Reason | Detail |
|--------|--------|
| Pricing | FAQ: resubmitting the same sermon for a new dashboard counts as another evaluation. |
| Coach | Compare drafts = different `sermon_versions`; each version may have its own evaluation history. |
| Operations | Failed runs stay auditable; rubric `prompt_version` bumps don’t overwrite past results. |
| UX | Default view: **latest `complete`** for that version; optional “history” later. |

**Constraint:** `UNIQUE (sermon_version_id) WHERE status IN ('pending','running')` — prevents double-click spam starting two concurrent jobs on the same draft.

**Quota counting:** Increment `profiles.evaluations_used_this_period` only when transitioning to `complete` (not on `failed`).

### Status column

| Status | Meaning |
|--------|---------|
| `pending` | Row created; Claude not started yet (optional micro-state if split insert from API call). |
| `running` | Anthropic request in flight. |
| `complete` | `result` populated, `overall_score` / `score_band` set. |
| `failed` | Terminal; `error_message` set; user can retry (new row). |

**Skip for v1:** `queued` (implies separate job infra), `cancelled` (nice later).

**State machine:**

```
pending → running → complete
                 ↘ failed
```

Insert as `pending` (or `running` immediately if single atomic action). Set `started_at` when entering `running`, `completed_at` when terminal.

### Where does structured JSON live?

**Primary: single `jsonb` column `result`.**

| Approach | Verdict |
|----------|---------|
| Single `jsonb` | **Yes** — matches nested dashboard (categories, criteria, heat map, rewrites). Easy to version whole payload with `prompt_version`. |
| Shredded columns | **No for v1** — many nullable columns, painful migrations when rubric adds a section. |
| `html_snapshot` column | **Defer** — optional cache later for share links; React render from JSON is the product path (BUILD_PLAN medium-term). |

Define a **TypeScript type + Zod schema** in `src/lib/evaluation/schema.ts` mirroring sample HTML sections (see §F).

---

## B. Evaluation request flow

### Plain language

- Button lives on the **sermon detail page** (`/dashboard/sermons/[id]`), next to the manuscript — “Evaluate this sermon.”
- Clicking checks quota, creates a DB row, runs Claude on the server, then sends the user to the **evaluation dashboard** (new route).
- User sees a **loading state** for the whole wait on v1 (no fake progress bar needed).
- If Vercel kills the request early, fall back to **poll status** (chunk 6.4).

### Technical recommendation

| Option | Use? | Notes |
|--------|------|-------|
| **Server Action** (orchestration) | **Yes** | Auth, quota, insert row, call evaluator — matches Step 5 `createSermon`. |
| **Route Handler** (`POST /api/evaluations/run`) | **Optional split** | If server action hits timeout, move long Claude call here with `export const maxDuration = 300`. |
| **Edge Function** | **No for v1** | Extra deploy surface; only if Vercel + sync fails. |
| **Inngest / queue** | **No for v1** | Right for scale; overkill pre-launch. |

**Recommended v1 flow:**

1. User on `/dashboard/sermons/[id]` clicks **Evaluate** (client `useTransition` + disabled button).
2. `requestEvaluation(sermonId)` server action:
   - Resolve `latest_version` (or explicit `version_id` when multi-version UI exists).
   - `profiles` quota check + concurrency check.
   - Insert `sermon_evaluations` (`running` or `pending` → `running`).
   - Call `runEvaluation()` (Anthropic) **in the same request**.
   - On success: `complete` + `redirect` to `/dashboard/sermons/[id]/evaluations/[evaluationId]`.
   - On failure: `failed` + return `{ ok: false, error }` to show banner.
3. Segment config on sermon routes: `export const maxDuration = 300` (requires Vercel plan that allows it; document in README).

**If synchronous fails in testing (504 after ~60s):**

- Chunk **6.4**: Action only inserts `pending` and returns `evaluationId`; client polls `GET /api/evaluations/[id]` every 3s; Route Handler or `after()` from `next/server` runs Claude. Same DB row, no new tables.

**Simplest path that works:** one server action, one wait, loading copy from FAQ (“a few minutes”). No WebSockets, no streaming tokens to the browser for v1.

---

## C. Claude API integration

### Plain language

- Use **Sonnet** for launch: strong enough for nuanced preaching feedback, much cheaper than Opus for monthly quotas.
- Keep the **system prompt in the repo** as a single readable rubric file, versioned with `prompt_version` on each row.
- Force **JSON output** via tool use or structured outputs — do not scrape free-form HTML from the model.
- Expect **large prompts** if the full rubric is inlined; budget **~$0.40–$1.50 per evaluation** depending on model and sermon length.

### Model choice

| Model | Role | Tradeoff |
|-------|------|----------|
| **claude-sonnet-4-6** | **Recommended default** | Best cost/quality for structured 15-criterion rubric + long manuscript. Fast enough for 2–4 min end-to-end. |
| **claude-opus-4-7** | Optional env override / “quality mode” later | Highest nuance (irony, FCF diagnosis, rewrite quality). ~3–5× cost; use for concierge or premium tier, not default 3×/mo Coach tier. |
| **claude-haiku-4-5** | **Not recommended** | Too thin for blockquotes, heat-map nuance, and Keller/Chapell-specific coaching voice. |

**Env:** `ANTHROPIC_API_KEY` (server only), `EVALUATION_MODEL` defaulting to Sonnet.

### System prompt location

**The rubric is the product.** It lives in one file you edit top to bottom like a manuscript:

```
src/lib/evaluation/rubric.md    # full system prompt: traditions, criteria, weights, voice, output rules
src/lib/evaluation/prompt.ts    # thin loader: read rubric.md, attach JSON schema reminder, build messages
src/lib/evaluation/schema.ts    # Zod + tool input_schema (code — not the rubric prose)
```

At runtime, `prompt.ts` reads `rubric.md` (e.g. `fs.readFileSync` or `import rubric from './rubric.md?raw'` depending on bundler setup) and passes it as the system message. No runtime assembly from multiple rubric fragments.

- **`prompt_version`** in DB: `'v1'`, `'v1.1'` when you materially change `rubric.md` — bump the constant in `prompt.ts` to match. Not editable in Supabase UI.
- **Not in database** for v1 (no CMS; git is source of truth).
- When the rubric changes, old evaluations keep their stored `prompt_version` for auditability.

### Output structure

**Use Anthropic tool use (or Messages API `output_config` / JSON schema) with a single tool, e.g. `submit_sermon_evaluation`, whose `input_schema` matches your Zod schema.**

Pipeline:

1. Call API with tool required.
2. `JSON.parse` tool input (or validate with Zod).
3. On Zod failure → retry once with “your previous response failed schema” **or** mark `failed` (see §E).
4. Persist validated object to `result` jsonb.
5. Derive `overall_score` / `score_band` from `result.headline` for list queries.

**Do not** ask Claude to emit HTML in v1.

### Prompt size and cost

**Rough sizes (40-minute manuscript):**

| Component | Tokens (approx) |
|-----------|-----------------|
| `rubric.md` (full system prompt) | 12,000–25,000 |
| Manuscript (user message) | 8,000–18,000 |
| Model output (JSON) | 6,000–14,000 |

**Implication:** Input-dominated cost. A large single-file rubric is expected — that’s the product. Keep the sample HTML **out** of the prompt (use rev2 for UI parity only); a short “quality bar” excerpt in `rubric.md` is enough if needed.

**Rough cost per evaluation (May 2026 list prices, verify before launch):**

| Model | Input ~25k + output ~10k | Order of magnitude |
|-------|--------------------------|--------------------|
| Sonnet 4.6 | ~$0.08 input + ~$0.15 output | **$0.25–$0.60** |
| Opus 4.7 | ~5× Sonnet | **$1.25–$3.00** |

At Coach **10 evals/mo** on Sonnet: **~$3–$7/mo** API cost per subscriber before margin — acceptable for $29 tier.

Add **`@anthropic-ai/sdk`** as a dependency in the chunk that introduces the API.

---

## D. Rubric / system prompt strategy

### Plain language

The rubric already exists in Chris’s head and in the sample outputs (Chapell FCF, Simeon Trust, Piper, Keller, Robinson, 9Marks). **Put all of it in one markdown file** — `src/lib/evaluation/rubric.md` — that you can read and edit start to finish like a manuscript. The rubric is the product, not code structure; splitting it across `chapell.ts` / `keller.ts` modules would make the thing you care about most painful to revise.

Don’t paste the entire marketing HTML sample into the prompt. Use rev2 for **layout** (React UI) and optionally a **short** quality-bar excerpt inside `rubric.md` for tone — not as the schema.

### Technical

| Strategy | Verdict |
|----------|---------|
| **Single `rubric.md` (recommended)** | One file, git-diffable, readable in the editor without jumping between modules. Loader in `prompt.ts` is ~20 lines of code. |
| **Modular `.ts` / multi-file assembly** | **No** — optimizes for code organization, not rubric authorship. |
| **Rubric in database / CMS** | **No for v1** — git remains source of truth; `prompt_version` on each evaluation row tracks which rubric generation produced the result. |

**What goes in `rubric.md`:** role and voice; all traditions and criteria (with double-weighted markers); scoring bands and weight math instructions; heat-map and growth-opportunity rules; constraints (blockquotes from manuscript, present-tense application, etc.); pointer to structured JSON output (details enforced by tool schema in `schema.ts`).

**What stays in code (`schema.ts` / tool definition):** JSON shape only — field names, required arrays, score ranges. The model gets prose instructions from `rubric.md` plus mechanical validation from the tool schema.

**Output contract** (sections to match rev2 HTML):

1. `meta` — title, passage, preacher, length, mode, source
2. `headline` — score /100, band label, verdict paragraphs (strength + improvement)
3. `categories[]` — 3 categories, each with criteria rows (score 1–5, principle tag, detail, blockquotes), category growth items
4. `heatmap` — beats + table rows (manuscript-inferred disclaimer)
5. `working[]` — 4 “what’s working” cards
6. `growthOpportunities[]` — 3 panels with principle badges + next steps
7. `priorities[]` — top 3 with practical steps
8. `rewrites[]` — 1–2 suggested rewrite pairs (weak / strong)
9. `methodology` — bands table, weight math, subtotals (model can compute; optionally **recompute scores in TypeScript** from criterion scores to prevent arithmetic hallucination)

**Validation split:**

- Model produces criterion scores + narrative.
- Server **optionally recomputes** weighted total and band from fixed weights in code (constants next to schema).

**Sample file usage:** Extract 1–2 **short** criterion detail examples from Tressler rev2 as “quality bar” in prompt (~1k tokens), not the full 74KB HTML.

---

## E. Error handling & cost controls

### Malformed JSON

1. Zod validate tool output.
2. **One automatic retry** with schema error snippet (same `evaluationId`, stay `running`).
3. Second failure → `failed`, `error_message`: “We couldn’t generate a valid evaluation. Please try again.” Log raw response server-side only.
4. Do **not** charge quota on `failed` (don’t increment `evaluations_used_this_period`).

### API timeout / rate limit / 5xx

- Catch Anthropic errors; set `failed` with safe message.
- **Timeout:** If using sync action, Vercel 504 may leave row stuck in `running` — add cron later OR manual cleanup query; for v1, on action catch, always attempt `failed` update in `finally`.
- **Stuck `running` > 10 min:** Dashboard admin script or SQL cleanup; optional heartbeat column later.

### Prevent 50 evaluations in 5 minutes

| Control | Enforcement |
|---------|-------------|
| One active job per user | Before insert: `select count(*) … status in ('pending','running')` joined to user’s sermons; reject if ≥ 1 |
| Cooldown | `profiles.last_evaluation_at` — reject if &lt; 60 seconds ago |
| Monthly cap | `profiles.evaluations_used_this_period` vs tier limit (see below) |
| UI | Disable button while `useTransition` pending |

No Redis required for v1.

### Monthly usage caps per tier

**Enforce in server action before Anthropic call** (authoritative):

```ts
if (profile.evaluations_used_this_period >= tierLimit(profile.plan_tier)) {
  return { ok: false, error: 'Monthly evaluation limit reached.' };
}
```

**`profiles` table (minimal, Step 6):**

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan_tier text not null default 'coach' check (plan_tier in ('coach', 'cohort')),
  evaluations_used_this_period int not null default 0,
  evaluations_period_start date not null default (date_trunc('month', now())::date),
  last_evaluation_at timestamptz,
  created_at timestamptz not null default now()
);
```

- Trigger on `auth.users` insert → create profile (mirror Step 4 pattern if you add one).
- **Stripe (Step 7+):** webhook updates `plan_tier`; optional mirror of Stripe subscription period for reset alignment.
- **Period reset:** On each evaluation request, if `now() >= evaluations_period_start + 1 month`, reset counter and bump `evaluations_period_start`.
- **Pre-Stripe dev:** `plan_tier` default `coach` (10 evals/mo in `tierLimit()`).

**Do not** rely on Stripe metadata alone at request time — DB is source of truth for gating; Stripe catches up async.

---

## F. UI / display

### Plain language

- After completion, user lands on **`/dashboard/sermons/[sermonId]/evaluations/[evaluationId]`** (or `/dashboard/evaluations/[id]` with sermon context in header).
- Render with **React components** styled like the sample (Tailwind + existing CSS variables `--sc-*`), not raw HTML from Claude.
- While waiting, stay on sermon detail (or evaluation route with skeleton) with clear copy: evaluating usually takes **2–4 minutes**, don’t close the tab.
- Library list can show a badge later: “Evaluated · 74/100” — optional in 6.5.

### Technical

| Piece | Path / component |
|-------|------------------|
| Evaluate CTA | `SermonDetailPage` + client `EvaluateButton` |
| Loading | Full-width panel on detail page OR redirect to evaluation page with `status !== complete` |
| Result view | `EvaluationDashboard.tsx` composed of `HeadlineLockup`, `CategoryCard`, `HeatMap`, `GrowthPanel`, `Priorities`, `RewriteBlock`, `Methodology` |
| Styles | Port key layout from sample (grid lockup, category header gradient, criterion accordion) — reuse patterns from `SermonManuscript` / dashboard panel |

**HTML samples:** Keep `public/sermon-evaluation-*.html` unchanged for marketing. Product UI should **look the same** but live in React for auth, RLS, and future share links.

**Accordion / heat map interaction:** Client components with `useState` (same as inline `onclick` in samples).

---

## G. Recommended order of implementation

Same rhythm as Step 5: **one chunk → `npm run build` → manual test gate → commit.**

| Chunk | What you build | Manual test gate | Est. time |
|-------|----------------|------------------|-----------|
| **6.1** | Migration: `profiles` (+ trigger), `sermon_evaluations`, RLS, indexes. Apply in Supabase SQL editor. | Tables exist; RLS blocks cross-user reads; unique partial index blocks two `running` rows same version. | **45–60 min** |
| **6.2** | `src/lib/evaluation/`: types, Zod schema (subset OK), queries (`getEvaluation`, `listEvaluationsForSermon`). Stub `requestEvaluation` that inserts `complete` with **fixture JSON** (no API). | Signed-in user can trigger stub → redirect → dashboard renders fixture. | **60–90 min** |
| **6.3** | Anthropic SDK + `rubric.md` + `prompt.ts` loader + `runEvaluation()` + tool schema. Wire into action; real API on dev only. | One real sermon → full JSON saved → scores look sane. Compare output structure to rev2 sample. | **90–120 min** |
| **6.4** | Evaluate button + loading UX on sermon detail; `maxDuration`; quota + cooldown + one-active-job checks in action. | Double-click blocked; over-quota shows message; loading state visible 2+ min. If 504, implement poll fallback same chunk. | **60–90 min** |
| **6.5** | React dashboard sections (headline + categories + growth + priorities first; heat map + rewrites + methodology second). | Visual side-by-side with `public/sermon-evaluation-tressler-2cor11-rev2.html`. Mobile width check. | **2–3 hrs** (split across two evenings if needed) |
| **6.6** | Error retry, failed state UI, token logging, `prompt_version`, list badge optional, README env docs. | Force bad schema → graceful fail; retry works; quota not incremented on fail. | **60–90 min** |

**Total estimate:** ~8–12 hours across **4–6 sessions** (matches Step 5’s two-commit rhythm; Step 6 may need 3–4 commits).

**Suggested commit messages:**

1. `Step 6: Add sermon_evaluations schema and profiles quota stub`
2. `Step 6: Add evaluation pipeline stub and dashboard render (fixture)`
3. `Step 6: Wire Claude evaluation with structured output`
4. `Step 6: Evaluate button, quota guards, and loading UX`
5. `Step 6: Complete evaluation dashboard UI and error handling`

---

## Decisions log (quick reference)

| Question | Decision |
|----------|----------|
| Table name | `sermon_evaluations` |
| FK target | `sermon_version_id` |
| Evaluations per version | Many historical; one active `pending`/`running` |
| JSON storage | Single `result` jsonb |
| API surface | Server action (+ Route Handler only if timeout) |
| Long wait v1 | Synchronous + loading UI; poll if needed |
| Model | Sonnet 4.6 default; Opus optional later |
| Prompt | Single `rubric.md` + `prompt_version` on each row |
| Output | Tool use / JSON schema + Zod |
| UI | React components, new evaluation route |
| Quota | `profiles` DB check before API; Stripe later |

---

## Out of scope for Step 6 (name it so it doesn’t creep in)

- Stripe Checkout / webhooks
- Shareable unlisted public URLs
- Audio upload + Whisper transcription
- Version picker UI (v2 manuscript) — schema already supports it
- Cohort sharing
- Storing generated HTML blob (unless share links arrive early)
- Migrating marketing samples into DB

---

## Prerequisites before starting chunk 6.1

- [ ] `ANTHROPIC_API_KEY` in `.env.local` (server-only, never `NEXT_PUBLIC_`)
- [ ] Confirm Vercel plan / `maxDuration` for production (or plan for 6.4 polling)
- [ ] Rubric prose drafted or ported into `src/lib/evaluation/rubric.md` (v1 can start thinner than the full skill; grow in one file)

---

*End of Step 6 plan.*
