# Criterion band ladders

**Canonical source for the 1 through 5 definitions on all eleven criteria.**
Drafted August 12, 2026. Reconstructed and revised August 12, 11:55 PM.

Reconciled against the live enum, 154 evaluations, v3.1 through v3.4. Eleven ids, four categories. Id 8 carries one legacy alias (`Heat Map: emotional delivery`, 4 rows, v3.1 only) that needs a `normalizeLegacyCriterionNames()` entry in the same commit as any rename.

Double-weighted: ids 3, 4, 7. Confirmed true on all rows.

---

## Status, August 12

These definitions exist in exactly one place, this file. The operative definitions the model actually reads live in `prompt.ts` and are thinner ("4: strong, doing the work well" against "3: adequate, present but not striking"). There are also partial sets in the calibration hand-scoring sheet and in the sermon-coach SKILL.md rubric reference. **Four sources, none of them authoritative. This file is the intended replacement.**

**What changed tonight.** The original draft was sequenced behind the cold reference set because it shipped alongside a symmetric inflation check aimed at the finding in 8.2, that the scale had no floor. That finding was retired on August 12 when the first mid-band submission from a stranger returned 31/55 on v3.4 with three 2s, four 3s, four 4s, and no 5s. The inflation check is cut from 4.1.

**What that does to these ladders.** Two things, in opposite directions.

The **rewritten general ladder still holds and matters more than before.** Giving 3 a positive definition is a clarity fix, not a downward correction, and it is what makes the set publishable. Cody's Exodus 15 sermon scored 2 on three criteria and there is currently nowhere he can look up what a 2 means.

The **presumptions still hold**, because they were never aimed at inflation. They implement the completeness finding from 5.1a: 17 evaluations across 13 books, contested cruxes engaged one or two out of three to four every time, overreach missed on every one. That is the surviving half of 4.1.

**The gate is gone.** Track 0.1 was downgraded from gate to background on August 12. These no longer wait on hand-scoring. They wait on the passage-first pass they depend on, and on the open items at the bottom of this file.

---

## The general ladder

Every criterion inherits this shape. The per-criterion text below defines what each rung means for that criterion.

- **5** — Could not have been executed better in this sermon, and nothing this criterion covers is missing.
- **4** — Complete and strong, with one improvement available that is a matter of execution rather than absence.
- **3** — Present and genuinely competent, but underdeveloped, generic, or asserted rather than shown. **This is the anchor and should be the modal score for a faithful weekly sermon.**
- **2** — Present in name only, or working against itself.
- **1** — Absent, or wrong.

Do not reserve 3 for weak sermons. A sermon that does a thing competently and unremarkably scores 3 on that criterion. A 4 requires something beyond competence.

## How presumptions work

Five criteria carry a presumption: a named condition that presumes a ceiling. A presumption is not a cap. Score above it when warranted, but when you do, the criterion narrative must say why, in plain language a preacher would use, without naming the rubric or the presumption.

**Locked decisions, August 12:**
- Presumptions are stated inline inside each band definition, never as a separate pre-scoring pass. A pre-score question on eleven criteria would add roughly 2,000 output tokens per evaluation, 8 to 15 cents on a $0.42 diagnostic, to buy behavior available from wording.
- One nullable boolean per criterion row records an override. **No reason string in the schema.** Override rate stays queryable; override reasoning lives in the narrative a pastor is already reading. Zero added generation cost.
- Override rate per criterion is the health check. Low rate with reasons that read well means the presumption works. High rate, or boilerplate reasons, means it has gone decorative and that criterion needs a hard cap.

---

# Category 1 · Text & Theology

## 1 · Textual fidelity & exegesis
*Simeon Trust*

Passage fidelity only. Does the sermon say what the text says? Simeon Trust's melodic line (the theme that holds the book together) is named as context in the display block and in this criterion's narrative. It is not a scored sub-question and must not move this band.

- **5** — The sermon's argument is the passage's argument, in the passage's order of emphasis. Every clause the application depends on is explained. Claims about the text are demonstrated in front of the congregation or attributed to something checkable, and none outruns what the text supports.
- **4** — The text drives the sermon and the main argument is the passage's, but a secondary clause goes unexplained, or the weight sits where the passage's does not, or a correct claim is asserted rather than shown.
- **3** — The passage is genuinely present and not contradicted, but the text illustrates the sermon rather than generating it. The main points could have come from a different passage. Or the sermon works accurately through what the text says and never reaches what it is doing.
- **2** — Springboard. Words lifted and repurposed. The argument is available without the text.
- **1** — Misreads the passage, or uses it as a pretext for a topic.

**Presumption.** Where a load-bearing clause, conditional, or connective in the primary passage goes unaddressed while the application depends on it, presume 3.

**Overreach bar, stated deliberately high.** A defensible mainstream reading is not overreach, even where another reading is available. Only flag a claim that exceeds what the text or the word can carry, and only where the argument leans on it. An incidental overstatement presumes 4. A load-bearing one presumes 3.

## 2 · Christ-centered / redemptive arc
*Chapell*

- **5** — The move to Christ runs through this passage's own redemptive logic and lands as the resolution of the burden the text raised.
- **4** — Genuinely Christ-centered, but the move is asserted rather than traced, or arrives at the end rather than governing the argument.
- **3** — Christ is present and honored. The path from text to Christ is a jump the hearer takes on the preacher's authority.
- **2** — Christ appended. The sermon's actual argument resolves without him.
- **1** — Moralism, or Christ as example only.

*No presumption. The obvious one duplicates the gospel clarity presumption below, and firing both on the same omission would double-penalize a single failure across two criteria, one of them double-weighted. That is how you manufacture a downward calibration error to replace an upward one.*

## 3 · Gospel clarity
*Piper, Keller* · **double-weighted**

- **5** — A listener with no Christian background could walk out and state what Jesus did and why it matters, in the sermon's own words. The gospel is the engine of the argument rather than a paragraph at the landing, and it comes from this passage rather than being imported.
- **4** — Explicit and reconstructible, but the gospel arrives at a seam instead of driving the argument, or it is stated in stock evangelical shorthand rather than in the terms this passage supplies.
- **3** — Orthodox and present, functionally decorative. A fluent listener recognizes it; a visitor could not reconstruct it. Typically Christ named and the cross referenced with no account of what the death accomplished or why the hearer needs it.
- **2** — Grace language without content. Or the sermon's actual solution to the problem it raised is the hearer's effort, with the gospel mentioned alongside but not doing the work.
- **1** — The sermon could be preached unaltered by a moral teacher from any tradition.

**Presumption.** Where the sermon reaches past the redemptive ground this passage supplies for a generic gospel paragraph, presume 4.

**Completeness is measured against the passage, never against a doctrinal checklist.** Do not penalize a sermon for omitting an element the passage does not raise. The question is whether the sermon used the christological weight this text put in front of it.

---

# Category 2 · Structure & Craft

## 4 · Fallen Condition Focus
*Chapell* · **double-weighted**

- **5** — The burden named is the one this passage addresses, in the passage's own terms, and it is named early enough to shape the sermon rather than to justify the application.
- **4** — The burden is textually grounded but broadened past what the passage names, or arrives late.
- **3** — A real human problem is named and the sermon addresses it, but it is the preacher's recurring burden rather than this text's. Competent and interchangeable across sermons.
- **2** — The problem is a moral deficiency in the hearer rather than a condition the passage diagnoses.
- **1** — No burden. The sermon explains a text to people with no reason to need it.

**Presumption.** Where the burden the sermon names is not the burden the passage names, presume 3.

## 5 · Structure
*Robinson*

Passage-level. The first sub-question is Robinson's **big idea** (Simeon Trust would call it the theme of the passage). It is not the melodic line, which belongs to the book and is named as context, not scored.

- **5** — One idea, every section earning its place, the ending inevitable.
- **4** — Clear spine, with one section overstaying or a transition announcing movement instead of creating it.
- **3** — Followable and orderly. Points assembled rather than built, and the order could change without loss.
- **2** — A spine the hearer has to reconstruct.
- **1** — No discernible argument.

*No presumption.*

## 6 · Hard things handled
*Simeon Trust*

- **5** — The passage's difficulty is named and resolved. The congregation leaves knowing where the preacher landed and why, including on a reading he could have avoided.
- **4** — Faced honestly, resolved thinly. The position is taken but the reason is asserted.
- **3** — The difficulty is acknowledged and left open, and the sermon does not depend on its resolution. Honest and incomplete.
- **2** — Named as difficult and then used for effect without resolution. The weight is raised and the hearer is left holding it.
- **1** — The hard thing is skipped, softened, or preached around.

**Presumption.** Where the sermon names a difficulty and the application depends on its resolution, and the resolution never comes, presume 2. Raising the weight and declining to carry it is a worse pastoral outcome than leaving the difficulty closed.

*This presumption lands at 2 where every other lands at 3 or 4, deliberately. It is the point 8.4.2 makes and neither report reached.*

---

# Category 3 · Application & Audience Connection

## 7 · Application to present audience
*Keller* · **double-weighted**

- **5** — Executable by Wednesday, named as behavior rather than posture, addressed to more than one kind of listener in the room, and flowing from the burden the text named rather than bolted on.
- **4** — Concrete and behavioral, but aimed at one imagined listener, or one step short of specific.
- **3** — Real application, generically addressed. "Trust God more," "make time for prayer." Could have been preached to any congregation in any decade.
- **2** — Posture only. A resolve to consider more.
- **1** — None, or the application contradicts the burden.

**Presumption.** Where the application would fit any congregation unchanged, presume 3.

## 8 · Emotional arc and dynamics
*Attribution open, see 5.29*

- **5** — Weight distributed the way the passage distributes it. The hard part is felt before the comfort arrives.
- **4** — A real arc, with one beat overplayed or underplayed.
- **3** — Sincere and level. One register throughout.
- **2** — Manufactured intensity, or comfort arriving before the offense has registered.
- **1** — No arc.

*No presumption. This is the criterion printing an internal slug where a source belongs. Either attribute to Piper under proportionality, which 4.1 already contemplates, or state plainly that it is unsourced. It cannot keep printing the slug on the surface where provenance is the whole argument.*

## 9 · Pastoral specificity
*No source attached anywhere in the ledger. Left unattributed rather than invented.*

- **5** — The sermon could only have been preached to these people, with at least one drift or pressure given a face.
- **4** — Specific in most moves, generic at the landing.
- **3** — Warm and addressed to a congregation, but not to this one.
- **2** — An audience assumed rather than known.
- **1** — Addressed to nobody.

*No presumption. This is the criterion the congregational profile in 9.3A most improves, and the one the competitor structurally cannot score because he never asks.*

---

# Category 4 · Ecclesial & Spiritual

## 10 · Ecclesial faithfulness
*9Marks*

- **5** — Addressed to a body with a life together rather than a room of individuals, and the sermon assumes the church is going somewhere after Sunday.
- **4** — Corporate in frame, individual in application.
- **3** — Doctrinally sound and individually addressed throughout.
- **2** — The church is incidental to the sermon's account of the Christian life.
- **1** — Undermines the body, or treats faith as private by construction.

*No presumption.*

## 11 · Expository exultation
*Piper*

- **5** — The preacher is visibly moved by what he found in the text, and the wonder is at God rather than at his own insight.
- **4** — Genuine warmth toward the text, expressed in one or two places rather than sustained.
- **3** — Reverent, controlled, informational.
- **2** — Performed enthusiasm not traceable to anything in the passage.
- **1** — Transactional.

*No presumption.*

---

## Open items this set depends on

1. **Id 8 alias** must ship in the same commit as any criterion rename, per the strict-on-write, alias-on-read rule.
2. **Emotional arc attribution** is a decision, not a defect. Make it before band definitions publish.
3. **Pastoral specificity has no source.** Either attach one that survives the provenance standard or state plainly that it is unattributed. Do not invent one.
4. **FCF sits in category 2, Structure & Craft.** It is a textual and theological move and one of the three double-weighted criteria. Filing it under craft understates it to a pastor reading category averages. Taxonomy choice worth making deliberately before 4.3 makes it public.
5. **The 11/55 row** should be pulled or excluded before it lands in a corpus statistic.
6. **Divergence between `composite_simple` and `composite_weighted` is the acceptance test for 4.1.** Currently identical on 54.5% of evaluations and within one point on 98%. If the edit restores 3 as a working anchor, divergence rises. If the distribution looks the same after the edit, the edit did not do what it claims regardless of where the mean moved.
7. **The shadow-run overreach number is suspect.** The ledger carries 2 to 6 per sermon, median 4, across 17 sermons, and that figure is load-bearing for 5.1a. Therapon was one of the flags and it was a false positive. Hand-audit three or four sermons and sort the flags into real overreach, defensible reading wrongly flagged, and genuinely contested, before the overreach half of the presumption language ships.

## Sequencing

These are prompt content. They ship inside the consolidated 4.1 edit alongside the passage-first pass and the three changes already held (criterion 7 grace-motivation cap, criterion 4 functional-centrality cap, emotional-arc Piper reframe). They do not ship in pieces.

**No longer gated on the cold reference set.** Track 0.1 was downgraded to background on August 12. What still gates 4.1 is the passage-first pass these presumptions read from, and open item 7 above.

Publication to pastors (5.5, 5.17, 4.3) follows the prompt edit, never precedes it. Publishing thresholds makes every score auditable. Note the live edge case: on the Hebrews 3 sermon, one criterion moving one point took the composite from 8.5 Exemplary to 8.4 Strong, because band thresholds run on the internal /55 while display runs on /10. A pastor comparing two of his own reports will find that eventually, and the disclosure line is what makes it defensible when he does.
