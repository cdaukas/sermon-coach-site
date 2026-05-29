# Calibration Fix — Unlock 5s in Scoring System Prompt

**Status:** Pending. Ship after retry-on-failure reliability fix.
**Effort:** ~30 minutes.
**Validated via:** Dan Diffey / Isaiah 66 sermon diff against Claude.ai reference eval (May 29, 2026).

## The Problem

Production API systematically range-compresses the top of the 1-5 scoring scale.
- 5 of 11 criteria scored -1 vs reference eval
- API never reached 5 on any criterion
- Composite gap: 41 → 36 (one full band: B-Strong → C-Faithful)
- 6 of 11 criteria matched exactly (where we agree = at 3)
- Zero criteria diverged in API-higher direction

This is range compression, not random variance.

## The Fix

Two surgical changes to the evaluation system prompt. Locate the file
containing the scoring instructions (likely `src/lib/prompts/evaluation.ts`
or similar — search for "Exemplary" or "Worth studying" to find it).

### Change 1: Add explicit 5-permission language

Insert this language in the scoring-rubric section of the system prompt:

> A 5 is the correct score when a criterion is met with the kind of
> execution worth studying or sharing with another preacher. Do not
> reserve 5s for unicorn sermons. Multiple criteria in a single faithful
> sermon can earn 5s. The A-Exemplary band (47-55) describes excellent
> preaching, not perfect preaching.

### Change 2: Loosen the 4-vs-3 threshold language

If the current prompt says a 4 requires "consistently strong work" or
"fully developed throughout," replace with:

> A 4 means the criterion is met with real strength, even if not unforgettable.

## Scope Guardrails

- Do NOT touch the 3 definition. That's the calibration anchor.
- Do NOT change band thresholds (47-55, 39-46, etc.).
- Do NOT change tone instructions. Tone is fine.
- Only modify: explicit 5-permission language + 4-vs-3 thresholds.

## Validation Protocol

1. Apply the two prompt changes.
2. Re-submit the SAME Diffey/Isaiah 66 sermon through the production engine.
3. Expected: composite lands 39-42 (B-Strong band).
4. If 39-42: calibration is fixed.
5. If still 36-38: tighten the prompt language further.
6. If overshoots to 45+: walk back the permission language.

## Honest Self-Assessment (which scores in the diff were right)

Of the 5 deltas where API was lower:
- Claude.ai more right (2): Christ-centered 5, Gospel clarity 5
- API more honest (2): Hard things handled 2, Expository exultation 3
- Coin flip (1): Structure

Conclusion: do NOT loosen scoring globally. The problem is specifically
the unreachability of 5, not generic strictness.
