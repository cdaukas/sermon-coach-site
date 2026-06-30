# SCHEMA_SPEC.md

Production schema specification for sermon-coach evaluations.
Canonical source: `/mnt/skills/user/sermon-coach/SKILL.md` (chat-side).
Derived artifact: `rubric.md` (in this repo, at `src/lib/evaluation/rubric.md`).
This file: the structural constraints `tool-schema.ts` must enforce.

If SKILL.md and this file disagree, SKILL.md wins. Update this file to match,
then update tool-schema.ts.

---

## Criterion structure

- **Exactly 11 criteria**, arranged 3 + 3 + 3 + 2 across 4 categories.
- Criterion names are canonical. Enum-lock them in Zod for v1 strict mode.

### Category 1 — Text & Theology (max 15 points)
1. Textual fidelity & exegesis *(Simeon Trust)*
2. Christ-centered / redemptive arc *(Chapell)*
3. Gospel clarity *(Piper)* — **double-weighted**

### Category 2 — Structure & Craft (max 15 points)
4. Fallen Condition Focus *(Chapell)* — **double-weighted**
5. Structure *(Simeon Trust, Robinson)*
6. Hard things handled *(Simeon Trust workshop practice)*

### Category 3 — Application & Audience Connection (max 15 points)
7. Application to present audience *(Keller)* — **double-weighted**
8. Heat Map: emotional delivery
9. Pastoral specificity *(Keller)*

### Category 4 — Ecclesial & Spiritual (max 10 points)
10. Ecclesial faithfulness *(9Marks)*
11. Expository exultation *(Piper)*

### Double-weighted criteria (load-bearing)
- #3 Gospel clarity
- #4 Fallen Condition Focus
- #7 Application to present audience

These three count twice in the weighted composite. Max weighted_raw = 70.

---

## Scoring

- Each criterion: integer 1–5.
- **Simple composite** = sum of all 11 criterion scores. Range 11–55. Displayed as `raw/55`.
- **Weighted composite** = `round(weighted_raw × 55 / 70)` where weighted_raw counts criteria #3, #4, #7 twice. Range 14–55 normalized onto /55 scale.
- **Category subtotals** are computed from criterion scores, not submitted independently. Subtotals: 15 / 15 / 15 / 10 = 55.

### Manuscript-only ceiling
- Criterion #8 (Heat Map: emotional delivery) caps at 4/5 when audio is unavailable.
- Effective manuscript-only ceiling: ~53/55.
- Schema should not enforce this — it's a content rule the model handles. But document it here so it doesn't get "fixed" by accident.

---

## Band labels (enum)

Band derived from **weighted score** (not simple).

| Range | Band |
|-------|------|
| 47–55 | Exemplary |
| 39–46 | Strong |
| 30–38 | Faithful |
| 22–29 | Needs Improvement |
| < 22  | Significant Concerns |

Enum values: `"Exemplary" | "Strong" | "Faithful" | "Needs Improvement" | "Significant Concerns"`.

Letter grade (A/B/C/D/F) is **not** a top-level field. It's a methodology-appendix concern only — derive it in the render layer, not the schema.

---

## Verdict shape

The verdict is two separate fields, NOT one concatenated string. Splitting them lets the schema enforce length caps per paragraph.

- `verdict.affirmation`: string, ~50–60 words, hard cap ~60 words.
  - Content: ONE named strength, slightly elevated altitude, no direct quotes from the sermon.
- `verdict.improvement`: string, ~15–20 words, hard cap ~25 words.
  - Content: ONE headline pointer — not an explanation. Single short sentence.
  - Must match `top_priorities[0]` in substance.

If Claude returns a single `verdict` string, the schema should reject. The split is structural.

---

## Top priorities

- `top_priorities`: array, **length exactly 3**. No more, no less.
- Each priority object:
  - `rank`: 1 | 2 | 3
  - `headline`: string (the serif headline naming the homiletical principle at stake)
  - `principle_tag`: string (e.g., "Chapell · Fallen Condition Focus")
  - `rationale`: string (2–3 sentences, grounded in sermon quote where helpful)
  - `practical_step`: string (concrete action Chris can take this week)
- `top_priorities[0]` must match `verdict.improvement` in substance.

---

## Per-criterion shape

Each criterion object:
- `id`: 1–11
- `name`: enum from canonical list above
- `category`: 1 | 2 | 3 | 4
- `tradition_tag`: string (e.g., "Simeon Trust", "Chapell")
- `score`: integer 1–5
- `narrative`: string (2–4 sentences, must include at least one direct sermon quote)
- `is_double_weighted`: boolean (true for #3, #4, #7; false otherwise) — derive in schema, don't trust the model

NO per-criterion `growth_opportunity` field. NO per-category `growth_opportunities` array.
**All prescriptive work consolidates into `top_priorities`.**

---

## Heat map (nullable / optional)

- `heat_map`: nullable object — present only when `audio_available === true`.
- For manuscript-only evaluations, `heat_map` is `null`. Schema accepts null.
- When present:
  - `beats`: array of beat objects, judgment-call length (typically 8–16 rows).
  - Each beat:
    - `time_range`: string (e.g., "18:00–21:10")
    - `beat_label`: string (e.g., "Caesar vs. Jesus")
    - `register`: enum from canonical 14-register list (humor, diagnostic, declarative, reverent, pastoral, awe, encouragement, convicting, doxological, teaching, climactic, invitation, tender, info)
    - `text_supports`: enum: `"strong" | "ok" | "partial" | "mismatch"` (maps to ✓ Strong / ✓ / ⚠ Partial / ✗ Mismatch)
    - `notes`: string (one-line assessment)

The heat map subsection is **omitted entirely** from rendered output when null. Criterion #8 still scores as a slider in the rubric — its narrative carries the diagnostic work in prose.

---

## Sections and section titles (locked)

These are render-layer concerns, but the schema should not return alternate titles. Lock them:

- `"Where It's Strong"` — What's Working
- `"Where You Can Grow"` — Top 3 Priorities
- `"What Improvement Looks Like"` — Suggested Rewrites

If section titles are in the schema at all, enum-lock them. Otherwise hardcode in the render layer.

---

## What the schema must NOT contain

- ❌ `category_growth_opportunities` (deleted in v2)
- ❌ `growth_opportunities_detailed` separate from `top_priorities` (these merge)
- ❌ `verdict` as a single concatenated string (split into affirmation + improvement)
- ❌ Letter grade as top-level field (derive in render layer)
- ❌ Category subtotals as submitted fields (compute from criterion scores)
- ❌ A "manuscript-inferred" heat map (heat_map is null or audio-backed; no third state)

---

## Validation behavior

- v1 strict mode: schema rejection on any drift. Better to fail loud than render malformed.
- Retry policy: on schema failure, log the model output, throw, surface a clean error to the user. No silent coercion.
- Cost logging: emit input/output token counts and total cost per eval to a log line before returning. (See `runEvaluation.ts` cleanup ticket.)

---

## Provenance

- SKILL.md version: v2 (May 2026 changelog, John 15 evaluation cycle)
- Last sync to rubric.md: 2026-05-25
- This file last revised: 2026-05-25
