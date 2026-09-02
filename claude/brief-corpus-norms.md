# Cursor brief: the corpus norms run

One concern: finish the validated parser module and produce reference distributions from the production corpus.

**No UI. No wiring into the evaluation pipeline. No prompt changes.** This branch produces a module, a validation report, and stored distributions.

**Runs in parallel with the Application deep dive branch.** The two are independent except for Step 0 item 2 below, which answers a question both need. Whichever branch runs first should record that answer where the other can find it.

Branch: `feat/corpus-norms`

---

## You are not starting from scratch

`sermon_parsers.py` already exists and has been validated against 17 of Chris's manuscripts. **Start from it.** It is a standalone Python module, no repo dependencies, spaCy for the one dependency-parse instrument.

Validation results are in `claude/norms-part-b-validation.md`. Summary of where it stands:

| status | instruments |
|---|---|
| **matches reference** | median sentence length (12.79 vs 12.4–13.7), interior:exterior (1.83 median vs 1.61), edge share, all-caps |
| **runs ~30% low, one systematic cause** | agency share, Christ density, locus count, locus spread |
| **untested** | TRD (fired 2 of 20), RI (3 of 17), the outline test (never) |
| **known bug** | `Why_Community__` returns 56 outline points |

**It also independently reproduced the corpus's known genre confound**: Christ density 11.7 apocalyptic, 8.2 Acts, 5.9 epistle, 2.8 wisdom. A 4.2-fold spread in the same order the gospel clarity reads found. That is the strongest evidence the module is sound, because a reimplementation can hit a mean by luck and cannot reproduce an ordering across six genres by luck.

---

## Step 0. Read-only. Report back before writing anything.

1. **Where does manuscript text live?** Table and column. Whether it is the text as submitted or processed.
2. **Manuscript or transcript? Detect it, store it, and expect a mixture.** **Both branches need this.**

   **The evaluation standard is what was preached, so this is a two-lens question, not a data-quality one.** Five instruments — TRD, L6, unfilled slots, the outline test, the spine census — read document structure and measure whether the preacher *stopped writing*, not whether he ended badly. They cannot run on a transcript, and a transcript cannot fail them.

   **Consequence for Part C: compute two sets of norms and never compare across them.** In a mixed corpus, transcript submitters would show near-zero unfinished conclusions and appear to land sermons better. They would not be. Add a `source_format` field, detected per sermon, stored, and reported. Several instruments require document structure — a transcript has no outline, no placeholder, no ALL-CAPS label. Report how many sermons have detectable structure (numbered points, `PROP:`, `BIG IDEA`, ALL-CAPS heading lines) and how many do not. **If most are transcripts, TRD, L6, the outline test and the spine census do not exist for most users**, and both this branch and the deep dive get thinner.
3. **Corpus shape.** Total sermons with text, excluding `deleted_at`. Distribution of sermons per user: how many at 1, 2–5, 6–10, 11+.
4. **Can spaCy ship?** `en_core_web_sm` is ~12MB and resolves the I1 distinction correctly out of the box (`Jesus carried` → `nsubj` of a verb; `the blood of Christ` → `pobj`). If it cannot ship cheaply, say so and I1 gets scoped separately rather than blocking the rest.
5. **Privacy.** Confirm whether aggregate statistics derived from user sermon text are covered by current terms. **Flag to Chris either way** — terms have not been attorney-reviewed and this computes over other people's sermons.

**Stop and report.**

---

## Part A. Three fixes

### A1. Recover the original lexicons

Four instruments run low by roughly the same third. That is one cause, not four: the word lists in `sermon_parsers.py` were written from summaries rather than from the source reports.

Recover and replace, from the corpus reports rather than by tuning:

- **Christ-referring tokens** (redemptive movement reads)
- **The fourteen redemptive-historical loci** (redemptive movement pre-registration §1, C1)
- **Church words** (ecclesial faithfulness reads)
- **The all-caps definition**, emphasis-only after stripping labels and stage directions (expository exultation reads)

**Do not tune each instrument to hit its reference.** Replace the lists and re-measure. If they still run low afterwards, that is a finding and it gets reported, not adjusted away.

**Note the composition trap:** the 17-manuscript validation sample was 35% Ecclesiastes, which pulls every Christ-related measure down. Part of the gap is sample, not lexicon. Do not over-correct.

### A2. Fix the outline-point bug

`Why_Community__.md` returns 56 outline points. A markdown footnote apparatus the current `clean()` does not catch. The Acts 18 case was fixed (81 → 5); this file uses a different form.

### A3. The length filter drops the manuscripts TRD exists to find

**Found 27 August and it affects every study in the project.** `Ecclesiastes 4:4-16` ends on two bare ALL-CAPS labels with no prose — TRD fires, L6 = 0.17, the lowest in the sample. It is 736 words and the ≥1,200 filter drops it. `Acts 20:17-38` is the same shape at 1,176 words.

**An unfinished manuscript is a short manuscript.** The filter removes a biased subset rather than noise.

**Fix:** keep the length filter for the corpus statistics, **compute the collapse measures (TRD, L6) on everything**, and report the two populations separately.

**And restrict them to the manuscript lens.** These are prep-diagnostic instruments, not preaching instruments. See Step 0 item 2.

---

## Part B. Re-run the validation

Same 17 manuscripts, same reference values, after A1–A3.

**Expect:** the four low instruments land in range. If they do not, report the correlation and say the instrument failed rather than adjusting it.

**Report every one, including passes.** An instrument landing materially off reference after the real lexicons is a finding, not a bug to be tuned out.

**Two checks with known answers, both from a census rather than a sample:**
- Christ as grammatical subject of a finite action verb inside a numbered outline point: **≈0.50%** of points.
- Points naming Christ at all: **≈6.9%**.

If the parser disagrees with those, the parser is wrong.

---

## Part C. The norms run

Run the validated module across every non-deleted sermon with text in production.

**The distinction that has to be right.**

**Per-sermon norms** answer "what does one sermon look like." Every sermon is one observation. ~138 non-Chris sermons supports this.

**Per-preacher norms** answer "what does a preacher's average look like." Each preacher is one observation and needs enough sermons for his mean to be stable. **Prior work found only nine preachers with six or more.**

**Compute both. Store under distinct names. Ship only per-sermon**, and phrase every downstream comparison as "compared with other sermons submitted to Sermon Coach," never "compared with other preachers."

**Store per instrument:** n, mean, median, SD, and the 10th / 25th / 50th / 75th / 90th percentiles.

**Exclude from the norms:** Chris's account, anything flagged `excluded_from_growth`, and evaluation-invalid sermons by the shape test in the Growth repair spec. **Then run once more with Chris included and report both.** If his numbers move the distribution materially, the corpus is too small to be a norm and that is the finding.

**Report on the face of the output:** how many distinct preachers contribute, and what share the largest contributor supplies. If one account exceeds ~15%, say so.

---

## Not in this branch

Any UI. Any wiring into the evaluation pipeline. Any prompt or `prompt_version` change. Any report. Any instrument not already in `sermon_parsers.py`. The grain tell for exultation, which needs a model rather than a parser.

---

## Verification

- Every Part B correlation reported and matched against reference, failures named.
- The spine census returns ≈0.50% and ≈6.9%.
- Running the module twice on the same sermon returns identical output.
- No network call and no model call anywhere in the module.
- Collapse measures computed on short manuscripts even where they are excluded from the statistics, and the two populations reported separately.
- The norms output states preacher count and largest-contributor share on its face.
- Per-sermon and per-preacher distributions stored under distinct names.

---

## Open for Chris

1. **TRD is effectively untested** — it fired twice in twenty. It carries the strongest finding in the project (conclusions unfinished 48 to 10, p < 0.001, four draws) and should not ship on that evidence. Needs three or four manuscripts with collapsed endings. Not blocking; the norms can run without it.
2. **Privacy.** Aggregate statistics over other people's sermons. Probably fine and probably covered, but worth a deliberate decision.
