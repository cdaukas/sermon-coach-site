# Session handoff — Step 6 (evaluation pipeline)

**Branch:** `build/product-layer` (pushed to `origin`)  
**Repo:** `~/Projects/sermon-coach-site`  
**Plan doc:** `STEP_6_PLAN.md`  
**Canon:** `/reference/SKILL.md` (dashboard layout); `public/sermon-evaluation-tressler-2cor11-rev2.html` (visual reference)  
**Last updated:** May 2026 (after chunks 6.1–6.5)

---

## Commits this session (Step 6)

| Commit     | Chunk | Summary |
|------------|-------|---------|
| `eeee120`  | 6.1   | `profiles` + `sermon_evaluations` migration, RLS, indexes |
| `737334c`  | 6.2   | Evaluation lib stub, fixture JSON, minimal dashboard UI |
| `48d8e14`  | 6.3   | Anthropic SDK, `rubric.md`, `runEvaluation()`, full tool schema |
| `79db4ab`  | 6.4   | Quota guards, async job + polling, `EvaluateButton` loading UX |
| `92adc34`  | 6.5a  | v2 snake_case schema, all dashboard section components, full fixture |
| `67368ac`  | 6.5b  | Align dashboard to skill canon (render-layer) |
| `2790453`  | 6.5c  | Remove orphaned page-level `FcfSection` (FCF stays in criterion card) |
| `17b4e33`  | docs  | Prior handoff update (6.5 / 6.7 deferrals) |

Branch should be pushed after each docs commit.

---

## Completed chunks

### 6.1 — Database

- Migration: `supabase/migrations/20260525120000_profiles_and_sermon_evaluations.sql`
- Tables: `profiles` (quota stub), `sermon_evaluations` (`result` jsonb, status, scores, tokens)
- `handle_new_user()` trigger → creates `profiles` row on signup; backfill for existing users
- RLS on `sermon_evaluations` via `sermons` → `sermon_versions` ownership chain
- Partial unique index: one `pending`/`running` row per `sermon_version_id`
- **Applied in Supabase SQL editor** (verify in target project before testing)

### 6.2 — Stub pipeline + minimal UI

- `src/lib/evaluation/`: `schema.ts`, `types.ts`, `queries.ts`, `fixture.ts`, `actions.ts`
- Route: `/dashboard/sermons/[id]/evaluations/[evaluationId]`
- Components: `EvaluationDashboard`, `HeadlineLockup`, `CategoryCard` (meta + headline + categories only)

### 6.3 — Real Claude integration

- `@anthropic-ai/sdk`, `rubric.md`, `prompt.ts` (`EVALUATION_PROMPT_VERSION=v2`), `tool-schema.ts`, `runEvaluation.ts`
- Zod + Anthropic tool schema for full evaluation output
- `processEvaluation.ts` (async job; used from 6.4)

### 6.4 — Guards, async UX, polling

- `quota.ts`: monthly caps (coach 6 / cohort 30), 60s cooldown
- `requestEvaluation`: quota + one-active-job-per-user; `after(processEvaluationJob)`; client polls `/api/evaluations/[id]`
- `EvaluateButton`: loading panel, 3s poll → navigate on `complete`
- `maxDuration = 300` on sermon detail page

### 6.5 — Full dashboard UI + skill canon (render-layer)

**Shipped in UI** (`EvaluationDashboard` + section components):

| Area | Behavior |
|------|----------|
| **Headline lockup** | Band (italic, no letter grade) → `raw_total/raw_max` (55-scale) → “Composite · See methodology at end”; verdict improvement opener bold + body regular |
| **Categories** | Four `CategoryCard`s with accordion criteria (FCF scored inside Structure & Craft) |
| **Heat map** | Rendered **only** when `heat_map.audio_processed === true` (hidden for manuscript-only) |
| **Lead with these** | `whats_working` cards |
| **Where You Can Grow** | `top_priorities` only (`PrioritiesSection`); amber growth panels **not** rendered |
| **What Improvement Looks Like** | Collapsible rewrites (`<details>`); first open |
| **Methodology** | Single collapsible appendix (collapsed by default); `/100` composites inside |

**Also:** `EVALUATION_FIXTURE` includes all sections for stub smoke test; legacy JSON normalizer in `schema-legacy.ts`.

**Not deleted yet (orphaned files / schema fields):** `FcfSection.tsx`, `GrowthOpportunitiesSection.tsx` — still in repo; `fcf` and `growth_opportunities_detailed` still in v2 JSON from Claude.

---

## Deferred to Step 6.7 (schema + prompt cleanup)

Do **not** start in 6.6 unless scope expands — tracked here and in `EvaluationDashboard.tsx` TODO.

| Item | Notes |
|------|--------|
| **Unified “Where You Can Grow”** | Merge `growth_opportunities_detailed` + `top_priorities` into one canonical array; update Zod, `tool-schema.ts`, `rubric.md`, prompts |
| **Stop generating hidden growth array** | Prompt/rubric should not require `growth_opportunities_detailed` once merged |
| **Remove top-level `fcf` from schema** | FCF lives in Structure & Craft criterion only; delete `fcf` from strict tool output + `FcfSection.tsx` |
| **Audio-conditional Claude output** | Model still emits `heat_map` for manuscripts today; optional: omit or slim beats when no audio (UI already hides) |
| **Delete orphaned components** | `FcfSection.tsx`, `GrowthOpportunitiesSection.tsx` after schema change |

---

## `schema.ts` — two shapes (v2)

| Export | Purpose | Sections |
|--------|---------|----------|
| **`evaluationResultSchema`** | DB read (`parseEvaluationResult`) | **Required:** `meta`, `scoring`, `verdict`, `categories`. **Optional:** `heat_map`, `whats_working`, `growth_opportunities_detailed`, `top_priorities`, `rewrites`, `fcf`, `methodology_note`. Legacy headline-only rows via `schema-legacy.ts`. |
| **`evaluationResultStrictSchema`** | Claude tool output | All sections required with length rules (4 categories, 3 growth, 3 priorities, etc.). |

**Keep in sync:** `tool-schema.ts` ↔ `evaluationResultStrictSchema` (snake_case).

---

## Real Claude path vs fixture path

Controlled by `requestEvaluation()` in `src/lib/evaluation/actions.ts`.

### Fixture (`EVALUATION_USE_STUB=1` in `.env.local`)

1. No `ANTHROPIC_API_KEY` required  
2. **No quota checks**, no cooldown, no active-job guard  
3. Single insert: `complete`, `result: EVALUATION_FIXTURE`, `prompt_version: fixture-v1`  
4. **`redirect()`** immediately to evaluation page  
5. Does **not** increment `profiles.evaluations_used_this_period`

### Real (default when stub off + API key set)

1. Requires `ANTHROPIC_API_KEY` (optional `EVALUATION_MODEL`)  
2. Quota + active-job guards → insert `pending` (`prompt_version: v2`)  
3. `processEvaluationJob()` → Claude → `complete` / `failed`  
4. On **complete**: full `result` jsonb, tokens, scores; quota increment  
5. Client polls every 3s → navigates to evaluation dashboard  

---

## Environment (`.env.local`)

Gitignored — open via **Cmd+P** → `.env.local`. Restart dev server after edits.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # JWT eyJhbGci... NOT sk-ant-...
ANTHROPIC_API_KEY=sk-ant-...
EVALUATION_MODEL=claude-sonnet-4-6
# EVALUATION_USE_STUB=1            # optional: force fixture path
```

---

## What's left

| Chunk | Work |
|-------|------|
| **6.6** | Hardening: failed-state polish, token logging, sermon list badge, README env docs; confirm quota not incremented on fail |
| **6.7** | Schema/prompt canon cleanup (see deferred table above) |

**Out of scope for Step 6:** Stripe, shareable public URLs, audio/Whisper pipeline, version picker UI, cohort sharing.

### 6.6 — Suggested scope (hardening only)

- Failed evaluation UX on sermon detail + evaluation routes (clear `error_message`, retry path)
- Token / model logging visibility (dev or admin-friendly)
- Sermon library badge when latest evaluation exists (`complete` / `failed` / in progress)
- README or env doc pass for evaluation variables
- Confirm quota increment only on `complete` (regression check)
- **Do not** expand into 6.7 schema/prompt work unless explicitly re-scoped

---

## Prompt architecture (what Claude sees today)

Claude is **not** given `SKILL.md` at runtime. There is no `reference/SKILL.md` in this repo.

| Layer | File | Role |
|-------|------|------|
| **System** | `src/lib/evaluation/rubric.md` | Loaded via `readFileSync` in `prompt.ts` → `buildSystemPrompt()` (cached in memory) |
| **System footer** | `prompt.ts` | Hardcoded: call `submit_sermon_evaluation` once, all sections |
| **User** | `prompt.ts` → `buildUserMessage()` | Working title + infer `meta` + full manuscript body |
| **Output shape** | `tool-schema.ts` + `schema.ts` | Anthropic tool `submit_sermon_evaluation`; Zod strict parse in `runEvaluation.ts` |
| **API call** | `runEvaluation.ts` | `system: buildSystemPrompt()`, `tool_choice` forced to evaluation tool |

`EVALUATION_PROMPT_VERSION` is **`v2`** (`prompt.ts`); stored on `sermon_evaluations.prompt_version` for real runs.

**Dashboard canon** (`/reference/SKILL.md` externally, React components locally) is **render-only** today — drift between SKILL UI rules and `rubric.md` + tool schema is expected until 6.7.

---

## Open sync question (6.7 or earlier)

**Should evaluation instructions single-source from SKILL?**

| Source today | Governs |
|--------------|---------|
| `rubric.md` + `tool-schema.ts` | Model behavior, JSON sections, scoring rules |
| SKILL (external) + dashboard React | Section order, labels, conditionals, typography |
| `SESSION_HANDOFF` / `STEP_6_PLAN` | Build tracking |

Options for a future session:

1. **Sync rubric → SKILL** — Copy or generate `rubric.md` from SKILL evaluation-output section; keep tool schema aligned.
2. **Load SKILL at runtime** — `prompt.ts` reads SKILL path (or committed `reference/SKILL.md`) instead of/in addition to `rubric.md`.
3. **Stay split** — SKILL = product/UI canon; `rubric.md` = model canon; document intentional diffs (e.g. hidden `growth_opportunities_detailed`, page-level `fcf` in JSON but not UI).

Until decided, treat **6.5 render work as complete** and **prompt/schema alignment as 6.7**.

---

## Gotchas for the next session

1. **Supabase anon key** — Must be JWT (`eyJ...`), not Anthropic `sk-ant-...`.

2. **Heat map on stub** — Fixture has `audio_processed: false` → no heat map block (expected).

3. **Growth panels in JSON, not UI** — `growth_opportunities_detailed` still stored; only `top_priorities` shown under “Where You Can Grow.”

4. **FCF** — No page-level FCF block; use Structure & Craft criterion accordion. `result.fcf` may still exist in DB until 6.7.

5. **Quota** — `tierLimit()`: coach 6 / cohort 30 per month; failed evals do not increment usage.

6. **Untracked** — `EMAIL_DELIVERABILITY.md` (do not commit unless intentional).

---

## Key file map

```
supabase/migrations/20260525120000_profiles_and_sermon_evaluations.sql
src/lib/evaluation/
  rubric.md, prompt.ts, tool-schema.ts, schema.ts, schema-legacy.ts
  runEvaluation.ts, processEvaluation.ts, quota.ts
  actions.ts, queries.ts, fixture.ts, types.ts
src/app/api/evaluations/[evaluationId]/route.ts
src/app/dashboard/sermons/[id]/evaluations/[evaluationId]/page.tsx
src/components/evaluation/
  EvaluationDashboard.tsx, HeadlineLockup.tsx, CategoryCard.tsx
  HeatMapSection.tsx, WorkingSection.tsx, PrioritiesSection.tsx
  RewritesSection.tsx, MethodologySection.tsx
  FcfSection.tsx              # orphaned — remove in 6.7
  GrowthOpportunitiesSection.tsx  # orphaned — remove in 6.7
public/sermon-evaluation-tressler-2cor11-rev2.html
```

---

## Quick smoke test

1. `npm run dev`  
2. Sign in → open sermon → **Evaluate sermon** (or stub)  
3. Evaluation page: band + raw/55 lockup; categories; no heat map (manuscript); Lead with these; Where You Can Grow; collapsible rewrites; collapsed methodology; **no** standalone FCF block between rewrites and methodology  
4. Supabase: `complete` row, full `result` jsonb (real path)
