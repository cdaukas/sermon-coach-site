# Part B re-validation

Run 2 September 2026 on `feat/corpus-norms`, after A1–A3 and `source_format`.
Module: `scripts/sermon_parsers.py`. Raw output: `claude/norms-part-b-revalidation.json`.
Original Part B (26–27 August): `claude/norms-part-b-validation.md`. Not overwritten.

**Part C was not run.** Privacy is unresolved.

**Verdict: the module still runs, Why_Community is fixed, collapse measures now fire on short manuscripts, and the genre confound still reproduces. Agency is now close to reference. Christ density, locus count, and locus spread moved toward reference but did not land in range. All-caps dropped by design. Interior:exterior moved away. Do not retune.**

---

## Sample

Same 17 usable manuscripts as August, plus the two shorts A3 exists to keep.

| genre | n | files |
|---|---|---|
| wisdom | 6 | Ecclesiastes ×5, Psalm 67 |
| Acts | 4 | Acts 18, 19, 20:17-24, Why Community? |
| OT narrative | 3 | 1 Samuel 2, Jonah 3, Jonah 4 |
| epistle | 2 | 1 Timothy 6:11-16 **final**, Romans 8 |
| prophecy | 1 | Isaiah 40 |
| apocalyptic | 1 | Revelation 3 |

**Path correction.** `Sunday Messages/1 Timothy/1 Timothy 6-11-16.md` is a 161-word scripture stub. The August run used a full manuscript. This run uses `1 Timothy/1 Timothy 6-11-16 final/1 Timothy 6-11-16 final.md` (3,288 words). All 17 are usable.

Idempotence on Why_Community: **pass.**

All 17: `source_format = manuscript`.

---

## Against reference

August column is the previous parser on this sample, before A1.

| instrument | this run | August | reference | verdict |
|---|---|---|---|---|
| **median sentence length** | **13.38** | 12.79 | 12.4–13.7 | **match** |
| edge share | 0.487 | 0.445 | 0.515 | **close** (~5% low) |
| all-caps /1k | 7.02 | 9.37 | 11.9 | **expected drop** — emphasis-only after stripping labels and stage directions |
| **agency share** | **0.164** | 0.116 | 0.176 | **close** (~7% low; was ~34% low) |
| Christ density /1k | 6.01 | 5.32 | 7.16–8.92 | **still low** (~16% below the bottom of the range) |
| locus count | 4.88 | 3.94 | 5.41 | **still low** (~10%; was ~27%) |
| locus spread | 8.35 | 7.06 | 9.8–10.1 | **still low** (~15%; was ~29%) |
| interior:exterior (median) | 2.00 | 1.83 | 1.61 | **off high** — verb list is Chris's, not retuned |
| TRD (usable 17) | 2 of 17 | 1 of 17 | — | **still thinly tested** |
| RI | 3 of 17 | 3 of 17 | — | unchanged; needs hand-coded counts |
| outline test | 5 of 17 | never on a full manuscript | — | now fires; see A2 |

**The four that were ~30% low are no longer one block.** Agency recovered. Density, locus count, and locus spread moved the same direction and stopped short of reference. That is the finding A1 asked for. The lists were replaced from the source reports, not from this table.

**Composition still pulls the Christ measures down.** This sample is 35% Ecclesiastes.

---

## Genre confound, still independent

Christ density /1k by genre:

| genre | n | this run | August |
|---|---|---|---|
| apocalyptic | 1 | 11.66 | 11.66 |
| epistle | 2 | 9.47 | 5.89 |
| Acts | 4 | 8.31 | 8.23 |
| prophecy | 1 | 6.22 | 5.36 |
| OT narrative | 3 | 4.27 | 4.01 |
| **wisdom** | **6** | **3.24** | **2.78** |

Wisdom still at the floor, apocalyptic still at the ceiling, ~3.6-fold spread (was 4.2). Epistle and Acts swapped after the token list expanded; the fairness problem for criterion 2 is the same. A pastor preaching Ecclesiastes still scores about a third of one preaching Revelation on this instrument, from the text he was given.

---

## A1 — lexicons recovered, not tuned

From the redemptive-movement, ecclesial, and exultation reports, not from closing the August gap.

- **Christ tokens:** `jesus, christ, messiah, savior, saviour, redeemer, immanuel, emmanuel`, plus `son of god / son of man` and `lamb of god`. Bare `Lord` and anaphoric `he` stay out. Spine census stays Jesus/Christ/Messiah only.
- **Fourteen loci:** expanded from C1 and the span-table quotes. Pentecost does not match bare `church`.
- **Church words:** furniture classes plus eldership, overseer, ordinance, saints, community/small group, members' meeting, our/this church.
- **All-caps:** emphasis runs only. Labels (`CAPS_STRUCTURAL`), stage directions (`CAPS_STAGE`), colon-labels, and ALL-CAPS runs of six or more words are stripped. The drop from 9.37 toward 7.02 is that definition, not a miss.

---

## A2 — Why_Community, 56 → 17

The brief called this a markdown footnote apparatus. **Wrong.** The leftover mass was a numbered “one another” verse catalog whose lines open with quotation marks (`1. “…Be at peace with each other.”`). Acts 18's HTML footnotes were already gone (81 → 5).

`outline_points()` now drops stage labels (`PRAYER`, `INTRO`, …), quote-catalog bodies, and footnote-shaped bodies. Remaining 17 lines are real structure: four main points and nested application, including the “Your job? / Your lawn?” list under Shared Witness. Those are numbered sermon lines, not footnotes.

The outline test fired on 5 of 17, including Why_Community (`Gospel Community is built…`). August never saw it on a full manuscript because the catalog drowned the mains.

---

## A3 — two populations

Length filter still gates **stats** (`usable`). Collapse measures run on every uncontaminated manuscript.

| file | words | usable | collapse_eligible | TRD | L6 |
|---|---|---|---|---|---|
| Ecclesiastes 4-4-16.md | 749 | false | true | **1** | **0.17** |
| Acts 20-17-38.md | 1197 | false | true | 0 | **0.17** |

Ecclesiastes 4 is the case A3 was written for: TRD fires, L6 = 0.17, and the ≥1,200 filter would have dropped it. Acts 20:17-38 has the same L6 and does **not** fire TRD. L6 and TRD are not the same instrument.

On the stats-eligible 17, TRD fires on Ecclesiastes 3-1-15 (TRD 1, L6 0.0) and Psalm 67 (TRD 2, L6 0.5). Still two hits in seventeen. The open item stands: needs collapsed-ending manuscripts before TRD ships.

---

## `source_format` — for this branch and the Application deep dive

Stored on every `analyze()` result. **Detected on flattening and intake path, never on absent outline markers.** A prose manuscript without numbered points is still a manuscript.

| signal | value |
|---|---|
| `intake_path == "youtube"` | `transcript` |
| flattened text: length ≥ 400, newlines ≤ 3, newline/char ratio < 0.002 | `transcript` |
| otherwise | `manuscript` |

Checked here: all 17 manuscripts → `manuscript`. A 500-word space-joined string → `transcript`. `intake_path="youtube"` on ordinary prose → `transcript`. Short flat text under 400 characters stays `manuscript`.

**Not a database column.** This branch does not wire the evaluation pipeline. Product storage is a later change. Until then, callers pass `intake_path` at analyze time and persist the returned field.

**Consequence already recorded in Step 0:** TRD, L6, unfilled slots, the outline test, and the spine census are manuscript-lens only. Transcripts skip them. Mixed-corpus norms (Part C, if it ever runs) must be two sets, never compared across.

---

## Spine census on the 17

| | this run | reference (497 manuscripts, 4,227 points) |
|---|---|---|
| outline points | 105 | 4,227 |
| naming Jesus / Christ / Messiah | 0 (0.0%) | 291 (6.9%) |
| Christ as nsubj of a finite action verb | 0 (0.0%) | 21 (0.50%) |

**This is the wrong grain.** Those percentages are a census, not a property of seventeen files, six of them Ecclesiastes. Zero naming in 105 points does not disprove 6.9% in 4,227, and it does not prove the parser. The check the brief asked for was not run: a library-wide census would be Chris's Cleaned Library, not production Part C. Left open.

---

## What was not done

- **Part C.** No production norms. No user sermon text. Privacy unresolved.
- Interior/exterior verb list. Still Chris's.
- No UI, no evaluation-pipeline wiring, no prompt changes.
- Spine census of the 497 / 4,227.

---

## Open for Chris

1. **Three instruments still low after the real lexicons:** Christ density, locus count, locus spread. Named, not tuned.
2. **All-caps is now a different instrument** than the 11.9 reference (emphasis-only). If a later norms run needs the old definition, say so; do not mix them.
3. **TRD** still thinly tested. A3 at least no longer hides the short manuscripts it is for.
4. **Spine ≈6.9% / ≈0.50%** needs a Cleaned Library census, not this sample.
5. **Privacy** still blocks Part C.
