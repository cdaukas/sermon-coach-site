# The Sermon Coach — Build Plan

Living plan for the product layer on `build/product-layer`: Next.js app + Supabase + Claude evaluations + Stripe, with marketing HTML unchanged in `public/`. Last updated May 2026.

---

## Build status (product branch)

| Session | Scope | Status |
|---------|--------|--------|
| **1–3** | Next.js scaffold, marketing at `public/`, Supabase clients + env | **Done** |
| **4** | Auth (login, signup, reset, protected `/dashboard`) | **Done** |
| **5** | Sermon schema (`sermons` + `sermon_versions`), paste-only submit, library list, detail | **Done** — **needs file upload + preview before evaluations ship** |
| **6a** | File upload UI (`.docx`, `.pdf`, `.txt`) | **Next** |
| **6b** | Server-side parsing (`mammoth`, `pdf-parse`) | Planned |
| **6c** | Preview / edit extracted text, then save | Planned |
| **7** | Evaluation pipeline (Claude, `sermon_evaluations`, dashboard UI) | Planned — see `STEP_6_PLAN.md` |
| **8** | Library polish (evaluation status on list, filters later) | Partially done; finish after **7** |
| **9–10** | Stripe (Checkout, Portal, webhooks, quota enforcement) | Planned |

**Detail for Step 7:** `STEP_6_PLAN.md` (single `rubric.md`, structured JSON, `prompt_version`).

---

## Session sequence (full build)

Order of work — each row is one **evening session** (~1.5–3 hours), same rhythm as Steps 4–5: build a chunk → `npm run build` → manual test → commit.

| # | Session focus | What ships | Notes |
|---|---------------|------------|--------|
| 1 | Foundation | Next on Vercel, `public/` marketing URLs, Supabase wiring | Done |
| 2 | *(often merged with 1)* | Homepage `/` → static marketing | Done |
| 3 | *(often merged with 1)* | Env + Supabase package layout | Done |
| 4 | **Auth** | Login, signup, password reset, middleware, dashboard shell | Done |
| 5 | **Submission UI (baseline)** | Title + paste textarea → `createSermon` → library + detail | Done; paste remains permanent fallback |
| 6 | **File upload component** | Dropzone / file picker on `/dashboard/sermons/new`; accept `.docx`, `.pdf`, `.txt`; client validation (type, size cap); calls parse endpoint — does **not** save sermon yet | No binary storage |
| 7 | **Server-side parsing** | Route Handler or Server Action: `mammoth` (docx), `pdf-parse` (pdf), raw read (txt); returns `{ text, warnings?, error? }`; never persist uploaded bytes | Vercel body size limit (~4.5 MB) — document in UI |
| 8 | **Preview / edit step** | After parse (or paste path): show extracted text in editable textarea + title; explicit **Submit sermon**; `createSermon` only receives final text | User confirms before DB write |
| 9 | **Evaluation — schema + stub** | `profiles`, `sermon_evaluations`, RLS; fixture JSON dashboard | `STEP_6_PLAN` chunk 6.1–6.2 |
| 10 | **Evaluation — Claude** | `rubric.md`, Anthropic tool output, `runEvaluation()`, quota guards | Chunks 6.3–6.4 |
| 11 | **Evaluation — UI** | Evaluate button, loading, React dashboard vs sample HTML | Chunks 6.5–6.6 |
| 12 | **Library page** | List badges (score / status), links to latest evaluation, empty states | Core list exists; this session is polish + eval links |
| 13 | **Stripe — products & Checkout** | Three tiers, founding coupon, Checkout session | |
| 14 | **Stripe — webhooks & quotas** | Webhook → `profiles.plan_tier`, monthly evaluation counter reset | DB enforces quota before Claude call |

### How many evenings?

| Phase | Sessions | Status |
|-------|----------|--------|
| Done (1–5) | **5** | Complete |
| Sermon intake upgrade (6–8) | **3** | Next |
| Evaluation (9–11) | **3** | After intake |
| Library polish (12) | **1** | After evaluation |
| Stripe (13–14) | **2** | Last |
| **Total** | **14 evenings** | **5 done → 9 remaining** |

Evaluation alone can stretch to **4 evenings** if chunk 11 runs long (dashboard parity with sample HTML). Stripe can stretch to **3** if webhook edge cases pile up. **Realistic range: 13–16 evenings** for the full product layer; **9–11 evenings** from today.

---

## Sermon intake (day one — not a fast-follow)

Preachers submit a **manuscript as text**. Files are a convenience input; the database stores **extracted text only**.

### Accepted formats

| Extension | Parser | Server package |
|-----------|--------|----------------|
| `.docx` | Word → HTML/text extraction | `mammoth` |
| `.pdf` | PDF → text extraction | `pdf-parse` |
| `.txt` | Read as UTF-8 | None (native) |

### Storage rule

- **Store:** `sermon_versions.content` (plain text), sermon title, timestamps.
- **Do not store:** uploaded file bytes, Supabase Storage objects, or S3 blobs for manuscripts in v1.
- **Privacy alignment:** `privacy.html` already describes sermon text stored for evaluation — no change needed for “text only.”

### UX flow (`/dashboard/sermons/new`)

Two paths, one outcome (confirmed text before save):

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Upload file     │────▶│ Parse (server)   │────▶│ Preview + edit      │
│ .docx/.pdf/.txt │     │ mammoth/pdf-parse│     │ textarea + title    │
└─────────────────┘     └────────┬─────────┘     └──────────┬──────────┘
                                 │ fail                      │
                                 ▼                           ▼
                        ┌────────────────┐          ┌─────────────────┐
                        │ Clear error +  │          │ Submit sermon   │
                        │ paste fallback │          │ createSermon()  │
                        │ (+ partial text)│         └─────────────────┘
                        └────────────────┘

┌─────────────────┐
│ Paste textarea  │──────────────────────────────▶ Preview (optional     
│ (skip upload)   │    or direct submit if paste   │  skip if user came  
└─────────────────┘    already edited in place)  │  from paste-only)   
```

**Preview step (required for file path):** After a successful parse, show the extracted text in the same manuscript textarea used for paste. Preacher reviews, edits, then submits. Title field stays visible throughout.

**Paste path:** Keep the current textarea as the fallback and primary path for preachers without a file. Paste can go straight to submit or through the same preview screen — implementation choice; file path must always preview.

### Error handling (parsing failures)

| Situation | User sees | Behavior |
|-----------|-----------|----------|
| Unsupported type / empty file | Clear message (“Please upload .docx, .pdf, or .txt”) | No server round-trip for obviously bad client picks |
| Parse throws or returns empty | “We couldn’t read that file. Paste your manuscript below.” | Open/focus paste textarea |
| Partial extraction | Same banner + **partial text** pre-filled in textarea | User fixes or pastes over |
| Network / server error | Generic safe message + paste fallback | Log detail server-side only |

Never silently save garbled or empty content from a failed parse.

### Implementation sketch (sessions 6–8)

- **`src/lib/sermons/parse.ts`** — `parseManuscript(buffer, mimeType | filename)` → `{ text: string, warnings: string[] }` or `{ error: string, partialText?: string }`
- **`POST /api/sermons/parse`** (or `parseManuscriptAction`) — auth required; accepts `FormData` file; max size check; no DB write
- **`SermonForm` refactor** — steps: `upload | paste` → `preview` (shared textarea) → submit via existing `createSermon`
- **Dependencies:** `mammoth`, `pdf-parse` (+ `@types` if needed); confirm both run in Node server runtime (not Edge) for session 7

### Out of scope for intake v1

- Audio/video upload and Whisper transcription (pricing mentions later)
- `.doc` (legacy Word), `.pages`, Google Docs links
- Storing original files “for re-parse”
- Auto-title from document metadata (nice later)

---

## Architecture (current)

### Two lanes

| Lane | Purpose | Keep as-is? |
|------|---------|-------------|
| **Marketing / public samples** | SEO, trust, zero auth | Yes — `public/*.html`, existing sample URLs |
| **Product** | Auth, manuscript intake, AI evaluations, library, Stripe | `src/app/*` on same deploy |

### Stack

- **Next.js 16 (App Router)** on Vercel
- **Supabase** — Auth, Postgres, RLS (`sermons`, `sermon_versions`; evaluations + `profiles` in Step 7)
- **Anthropic** — Claude for evaluations; `rubric.md` server-side only
- **Stripe** — Checkout, Customer Portal, webhooks → tier + monthly quota
- **Parsing** — `mammoth` + `pdf-parse` in Node route/action; no Storage bucket for manuscripts

### Data model (implemented + planned)

| Table | Purpose |
|-------|---------|
| `sermons` | `user_id`, `title`, timestamps |
| `sermon_versions` | `content` (extracted/pasted text), `version_number` |
| `profiles` | Plan tier, `evaluations_used_this_period` (Step 7) |
| `sermon_evaluations` | Per-version AI run, `status`, `result` jsonb, `prompt_version` (Step 7) |

Optional later: `source` enum on version (`paste` | `docx` | `pdf` | `txt`) for analytics — not required for v1.

### Evaluation output

- **Canonical UI:** `public/sermon-evaluation-*.html` samples
- **Product:** Claude → validated JSON → React dashboard (see `STEP_6_PLAN.md`)
- **Not v1:** Store generated HTML blob; shareable public links (post-Stripe)

### Phased order (revised)

1. **Foundation + auth** — Done  
2. **Manuscript intake** — Paste done; **file → parse → preview → save** (sessions 6–8)  
3. **Evaluation pipeline** — Claude + DB + dashboard (sessions 9–11)  
4. **Library** — List/detail done; polish with evaluation links (session 12)  
5. **Stripe** — Billing + quota enforcement (sessions 13–14)  
6. **Later** — Share links, audio/transcription, cohort sharing, marketing CTAs → sign-in

### Risks to name early

- **PDF quality** — Scanned PDFs parse poorly; error copy should suggest paste or a text-based PDF.
- **DOCX complexity** — Footnotes, text boxes, multi-column layouts may extract out of order; preview step mitigates.
- **Vercel request size** — Large `.docx`/`.pdf` uploads may hit limits; cap file size in UI (e.g. 10 MB) with clear message.
- **Evaluation cost/time** — 20–60s+ Claude runs; sync + loading UI first, polling if timeouts (see `STEP_6_PLAN.md`).
- **Founding member cap (25)** — Stripe promotion + app metadata when billing ships.

---

## Marketing vs product today

`pricing.html` documents tiers and evaluation quotas. CTAs are still **waitlist** on marketing pages. Legal pages describe the full SaaS. **Engineering on `build/product-layer`:** auth + paste submission live; evaluations and Stripe not yet.

### Public sample evaluations

Static HTML in `public/` — not generated from Supabase. Linked from `index.html`. Product evaluations will match that presentation via React, not by committing new HTML per user.

---

## Remote / infra

- **Git remote:** `https://github.com/cdaukas/sermon-coach-site.git`
- **Product branch:** `build/product-layer`
- **Production marketing:** `www.sermoncoach.online`
- **Secrets:** `NEXT_PUBLIC_SUPABASE_*`, `ANTHROPIC_API_KEY` (Step 7), Stripe keys (sessions 13–14)

---

## Related docs

| File | Contents |
|------|----------|
| `STEP_6_PLAN.md` | Evaluation pipeline: schema, Claude, `rubric.md`, UI chunks, quotas |
| `AGENTS.md` | Next.js 16 notes — read `node_modules/next/dist/docs/` before API changes |

---

*When Step 5 paste-only flow is extended with upload + preview, update session 5 row above to “Done + intake complete” and tick sessions 6–8.*

---

## Step 8 — Rubric/prompt consistency audit

After v2.5 lands, do a one-time audit pass.

**Goal:** Find every rule that appears in BOTH rubric.md AND prompt.ts STRUCTURAL_CONTRACT (or that prompt.ts enforces via Zod refinement), and verify they say the same thing.

**Known prior failures of this kind:**
- Improvement word count: rubric.md said ~15-20, prompt.ts said ≤32 (fixed in v2.4, commit 1281b8a)
- Verdict quotation marks: rubric.md said "no sermon quotes", prompt.ts said "no quotation marks at all" (fixed in v2.5)

**Method:**
1. Read rubric.md and prompt.ts side by side
2. For every rule that touches verdict, criterion structure, or scoring, check whether both files agree
3. Report any mismatches with severity (strict-vs-loose vs. cosmetic)
4. Patch the looser one to match the stricter one (default direction)

**Rationale:** Claude obeys the looser of two conflicting instructions, then the Zod schema rejects it. Each instance costs ~$0.50 in failed API calls plus a debugging session. Cheaper to audit once than to discover one at a time.

**Precondition:** Do not run this audit until v2.5 passes a successful end-to-end eval.
