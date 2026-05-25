# Session handoff — Step 6 (evaluation pipeline)

**Branch:** `build/product-layer`  
**Repo:** `~/Projects/sermon-coach-site`  
**Plan doc:** `STEP_6_PLAN.md`  
**Last updated:** May 2026 (after chunks 6.1–6.4)

---

## Commits this session (Step 6)

| Commit     | Chunk | Summary |
|------------|-------|---------|
| `eeee120`  | 6.1   | `profiles` + `sermon_evaluations` migration, RLS, indexes |
| `737334c`  | 6.2   | Evaluation lib stub, fixture JSON, minimal dashboard UI |
| `48d8e14`  | 6.3   | Anthropic SDK, `rubric.md`, `runEvaluation()`, full tool schema |
| `79db4ab`  | 6.4   | Quota guards, async job + polling, `EvaluateButton` loading UX |

Local branch was **2 commits ahead** of `origin/build/product-layer` after 6.4 (6.3 + 6.4); push when ready.

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

- `src/lib/evaluation/`: `schema.ts` (core subset), `types.ts`, `queries.ts`, `fixture.ts`, `actions.ts`
- Route: `/dashboard/sermons/[id]/evaluations/[evaluationId]`
- Components: `EvaluationDashboard`, `HeadlineLockup`, `CategoryCard` (meta + headline + categories only)
- Stub inserted `complete` row with `EVALUATION_FIXTURE` (`prompt_version: fixture-v1`)

### 6.3 — Real Claude integration

- `@anthropic-ai/sdk`, `rubric.md`, `prompt.ts` (`EVALUATION_PROMPT_VERSION=v1`), `tool-schema.ts`, `runEvaluation.ts`
- Extended Zod + Anthropic tool schema for **all nine** output sections (see schema below)
- `processEvaluation.ts` added in 6.4 (Claude work moved out of sync action)

### 6.4 — Guards, async UX, polling

- `quota.ts`: monthly caps (coach 3 / coach_plus 6 / cohort 30), `DEV_EVALUATION_LIMIT` override, 60s cooldown, period reset, increment on **complete** only
- `requestEvaluation`: quota + one-active-job-per-user checks; insert `pending`; `after(processEvaluationJob)`; returns `{ evaluationId, sermonId }` (no redirect)
- `GET /api/evaluations/[evaluationId]` for status polling
- `EvaluateButton`: loading panel, elapsed time, usage line, polls every 3s → navigates on `complete`
- `maxDuration = 300` on sermon detail page
- `EvaluateStubButton` re-exports `EvaluateButton` for compatibility

---

## `schema.ts` — two shapes

| Export | Purpose | Sections |
|--------|---------|----------|
| **`evaluationResultSchema`** | Read from DB (`parseEvaluationResult`) | **Required:** `meta`, `headline`, `categories`. **Optional:** `heatmap`, `working`, `growthOpportunities`, `priorities`, `rewrites`, `methodology` — so old fixture rows (3 sections only) still parse. |
| **`evaluationResultStrictSchema`** | Validate Claude tool output (`parseEvaluationResultStrict` in `runEvaluation.ts`) | **All nine sections required** with array length rules (e.g. 4 working cards, 3 growth panels). |

**UI today** only renders the three core sections (`EvaluationDashboard.tsx`). Full JSON from Claude is stored in `result` jsonb; **6.5** adds React sections for the rest.

**Keep in sync:** `tool-schema.ts` JSON Schema must match `evaluationResultStrictSchema` field names (camelCase).

---

## Real Claude path vs fixture path

Controlled by `requestEvaluation()` in `src/lib/evaluation/actions.ts`.

### Fixture (`EVALUATION_USE_STUB=1` in `.env.local`)

1. No `ANTHROPIC_API_KEY` required  
2. **No quota checks**, no cooldown, no active-job guard  
3. Single insert: `status: complete`, `result: EVALUATION_FIXTURE`, `prompt_version: fixture-v1`  
4. **`redirect()`** immediately to evaluation page  
5. Does **not** increment `profiles.evaluations_used_this_period`

### Real (default when stub off + API key set)

1. Requires `ANTHROPIC_API_KEY` (and optional `EVALUATION_MODEL`, `DEV_EVALUATION_LIMIT`)  
2. `checkEvaluationQuota()` + `countActiveEvaluationsForUser()` before insert  
3. Insert `pending` row (`prompt_version: v1`)  
4. `after()` runs `processEvaluationJob()` → `running` → Claude `runEvaluation()` → `complete` or `failed`  
5. On **complete**: writes full `result`, tokens, scores; **`recordEvaluationComplete()`** bumps monthly counter + `last_evaluation_at`  
6. On **failed**: `error_message` set; **no** quota increment  
7. Action returns `{ ok: true, evaluationId, sermonId }`; client **polls** `/api/evaluations/[id]` every 3s, then `router.push` to dashboard  

---

## Environment (`.env.local`)

Gitignored (`.env*` in `.gitignore`) — **hidden from sidebar**; open via **Cmd+P** → `.env.local`.

Expected variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # JWT eyJhbGci... NOT sk-ant-...
ANTHROPIC_API_KEY=sk-ant-...
EVALUATION_MODEL=claude-sonnet-4-6
DEV_EVALUATION_LIMIT=99              # optional dev override for tier caps
# EVALUATION_USE_STUB=1            # optional: force fixture path
```

Restart `npm run dev` after any `.env.local` change.

---

## What's left (`STEP_6_PLAN.md`)

| Chunk | Work |
|-------|------|
| **6.5** | Full evaluation dashboard UI: heat map, working, growth opportunities, priorities, rewrites, methodology — match `public/sermon-evaluation-tressler-2cor11-rev2.html` |
| **6.6** | Hardening: failed-state polish, token logging, optional list badge on sermon library, README env docs; confirm quota not incremented on fail |

**Suggested next commit message (6.5):** `Step 6: Complete evaluation dashboard UI`  
**Suggested next commit message (6.6):** `Step 6: Complete evaluation dashboard UI and error handling` (per plan wording)

**Explicitly out of scope for Step 6:** Stripe, shareable public URLs, audio/Whisper, version picker UI, cohort sharing, HTML blob storage.

---

## Gotchas for the next session

1. **Wrong key in wrong env line** — Pasting `ANTHROPIC_API_KEY` into `NEXT_PUBLIC_SUPABASE_ANON_KEY` breaks login with generic “Something went wrong.” Supabase anon key is a **JWT** (`eyJ...`).

2. **`.env.local` not in file tree** — Use Quick Open (`Cmd+P`) or disable “Exclude Git Ignore” in explorer.

3. **Dashboard UI ≠ stored JSON** — Claude saves all sections; UI shows three. Don’t assume missing data until you inspect `sermon_evaluations.result` in Supabase.

4. **Zod strips unknown keys only on parse** — Use `evaluationResultStrictSchema` for API; `evaluationResultSchema` for DB reads. Extend both when adding fields.

5. **Multiple dev servers** — Old `next dev` on 3002/3003 may linger; kill with `pkill -f "next dev"` and use the port shown in terminal (often **3000** after restart).

6. **Quota testing** — `DEV_EVALUATION_LIMIT=99` bypasses tier limits; remove to test real caps. Failed evaluations do not consume quota.

7. **Active evaluation constraints** — DB index: one `pending`/`running` per version; app guard: one `pending`/`running` per **user** across all sermons.

8. **Manual test SQL** — RLS and partial-unique-index tests were run in Supabase SQL editor during 6.1; not committed.

9. **Model ID** — Default `claude-sonnet-4-6`; if API returns model-not-found, use a dated model id from Anthropic console in `EVALUATION_MODEL`.

10. **Untracked** — `EMAIL_DELIVERABILITY.md` in repo root (unrelated); do not commit unless intentional.

---

## Key file map

```
supabase/migrations/20260525120000_profiles_and_sermon_evaluations.sql
src/lib/evaluation/
  rubric.md, prompt.ts, tool-schema.ts, schema.ts
  runEvaluation.ts, processEvaluation.ts, quota.ts
  actions.ts, queries.ts, fixture.ts, types.ts
src/app/api/evaluations/[evaluationId]/route.ts
src/app/dashboard/sermons/[id]/page.tsx          # EvaluateButton, maxDuration
src/app/dashboard/sermons/[id]/evaluations/[evaluationId]/page.tsx
src/components/evaluation/EvaluateButton.tsx
public/sermon-evaluation-tressler-2cor11-rev2.html   # UI spec for 6.5
```

---

## Quick smoke test

1. `npm run dev` → note port  
2. Sign in at `/login`  
3. Open a sermon → **Evaluate sermon**  
4. Wait for loading panel → redirect to evaluation (real) or instant (stub)  
5. Supabase: row `complete`, full `result` jsonb, `evaluations_used_this_period` incremented (real path only)
