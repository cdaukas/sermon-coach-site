# Post-Beta / Backlog (added 2026-05-31)

## Cost & observability

- [ ] **Log token usage + model per eval.** Persist `usage.input_tokens`,
  `usage.output_tokens`, and the model name to the `sermon_evaluations` row
  on every eval. Enables exact per-eval and per-tier cost via SQL. Highest
  value — ends all cost estimation. (Confirmed cheap: a full night of Opus
  test runs cost ~$0.28.)
- [ ] **Prompt caching on the system prompt.** System prompt is large and
  identical every eval; caching cuts input cost ~90%. Skip for beta volume;
  worth it at hundreds of evals/mo.

## Calibration fidelity (NOT score-chasing — port from SKILL.md)

- [ ] **Port "C-Faithful is the normal/expected score" framing** into the API
  system prompt. Biggest likely-missing anchor; stabilizes the whole scale.
- [ ] **Port "A-band is the ceiling, don't chase all-5s"** language.
- [ ] **Climb-note crispness check on Opus.** Verify the "to reach the next
  level, do X" sentence still fires cleanly on criteria scoring 1-3 under
  Opus. (Weak-sermon report is the place to confirm — it has several 1-3s.)
  Small isolated prompt tune only if mushy. Do AFTER calibration is locked.
  > Requires pasting current `buildSystemPrompt()` text to do line-level.
- [ ] **Criterion 8 redesign: "Emotional architecture" (full scope).**
  Replace the current Heat Map / delivery framing with a textual
  emotional-arc criterion aligned across skill and product:
  - Rename "Heat Map / emotional delivery" → **"Emotional architecture"**
  - Redefine as textual emotional-arc assessment (structure, beats, turns,
    climax build) — what's observable on the page, NOT delivery
  - Lift the manuscript cap; score 1–5 like every other criterion
  - Re-anchor what 1–5 mean for the new definition
  - Update **both** SKILL.md and the product (prompt, Zod name enum,
    dashboard label, marketing) so the hand-tool and the SaaS stay
    calibrated to each other
  - Calibration discipline: score a known reference sermon first, canary
    that OTHER criteria don't move, version-bump prompt, confirm band
    stability before merge
  - All four (rename, redefine, lift cap, re-anchor) ship together or the
    rename lies about behavior.

## Near-term product

- [ ] **Evaluation export.** Product renders evaluations only in the
  dashboard — no download/export. This blocks (a) generating samples from
  real product output, (b) the data-portability promise in the privacy
  policy and FAQ, and (c) preachers saving, printing, or sharing their own
  evaluations. Add a download-as-PDF/HTML or print-friendly view. Surfaced
  when sample-making had to fall back to skill output because the product
  had no export path.

## Infrastructure / reliability

- [ ] **Vercel Pro upgrade before charging reservists.** Commercial standing,
  reliability, longer function ceiling. (Hobby works for free beta; upgrade
  before any paid subscription.)
- [ ] **Export/email render-path check.** Confirm climb notes, report
  cosmetics, and narrative changes render in the EMAILED/EXPORTED eval, not
  just the dashboard. This path has diverged from the dashboard before.

## Pricing levers (post-beta)

- [ ] **Tiered model by plan.** Sonnet on cheap tier, Opus on premium, via the
  `EVALUATION_MODEL` env-var pattern already in place. Turns model cost into a
  pricing feature.
- [ ] **US-only inference option (1.1x pricing).** ~10% cost bump to keep all
  inference inside the US. Worth considering given privacy positioning to
  pastors. Evaluate post-beta.
