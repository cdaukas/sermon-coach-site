# Monday Morning — Where You Left Off

## State of the launch (end of Friday May 29)

- 10-eval reliability test complete: 8/10 first-try, 100% on retry
- Two failure modes diagnosed: malformed Claude response, client timeout
- Calibration delta validated: API range-compresses top of 1-5 scale
- Both fixes scoped, Asana tasks created with full diff and rationale

## Today's work (in order)

1. **Retry-on-failure pattern** (3-5 hours)
   - See Asana: "Retry-on-failure for evaluation submission"
   - Wrap Claude API call + Zod validation in try/catch with one retry
   - Make sure retry does NOT count against user quota
   - Log retries to Vercel so success rate is observable

2. **Calibration fix** (30 min, after retry pattern ships)
   - See CALIBRATION_FIX_PENDING.md in this repo
   - Two prompt changes only
   - Re-test on Diffey/Isaiah 66 sermon — should land 39-42

3. **5-eval confirmation test** (1-2 hours)
   - Vary sermon length and content type
   - Re-run the two sermons that failed Friday
   - Target: 5/5 first-try

4. **Stripe wiring** — only after 5/5 confirmation passes

## DO NOT
- Send reservist emails until 5/5 confirmation passes
- Rewrite the rubric or change band thresholds
- Touch the auth.getUser() prewarm in dashboard/layout.tsx (load-bearing)

## Start prompt for Claude in Cursor

"Read CALIBRATION_FIX_PENDING.md and MONDAY_START.md, then walk me
through implementing the retry-on-failure pattern from the Asana task.
Pause for my approval before each file change."
