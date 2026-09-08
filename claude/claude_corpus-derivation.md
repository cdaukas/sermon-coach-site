# Corpus derivation

The record of what has been derived from reading the Daukas corpus criterion by criterion: the measurable patterns, the instruments that worked, the instruments that failed, and the rules the work has produced.

Started 23 August 2026. **Living document.** Two reads per criterion. **All eleven done, 23–26 August 2026.** Twenty-two reads, one census, one composition audit.

---

## Why this exists

The eleven-criterion rubric defines what earns a 1 through 5 on a single sermon. It says nothing about what a *pattern* looks like across a body of work. Those are different objects: one is a verdict, the other is a description of a habit.

The quarterly criterion deep dive needs the second thing, and it does not exist. This document is where it gets built, one criterion at a time, by reading the corpus with no framework and keeping what survives replication.

**Method per criterion.** An open read on roughly 40 to 60 manuscripts with no rubric supplied, then a replication that is explicitly asked to test the first read's findings and report failures. Both reads run in the chat app against the manuscript folder, not through the API and not against Supabase.

**Revised 23 August after the ecclesial faithfulness reads: the second read must be a year-stratified random draw, blind to content, not merely a disjoint set.** See rule 9.

---

## The rules this work has produced

These are binding on everything downstream.

**0. A single reader coding twice replicates the corpus, not the coding rule. This reaches back across every criterion in this document.**

The pastoral specificity replication caught itself. SPECIFIC rose 18 points between runs, and the frozen instruments settled why: the run-2 draw was **less** in-room dense on every measure (8.19 → 5.85 markers per sermon, 1.38 → 0.67 local names), yet more sermons were coded SPECIFIC, and the SPECIFIC-minus-GENERIC gap narrowed on all three measures.

A thinner draw, coded more generously, with a blurrier boundary. **That is a looser threshold, not a more pastoral sample.** The report named the sermon it let across that run 1 would have failed.

**Every criterion here was one reader coding twice.** All eight. Every hand-coded proportion carries this exposure; only the mechanical instruments were immune, which is why they could catch it. The structure reads found the same thing independently at smaller scale, when argumentative transitions moved from 10% to 34% with the corpus unchanged.

**Mitigations, in order of preference.** Fix the boundary numerically before opening anything (e.g. require an attached case or a named cost before a code can be assigned). Or supply a second independent coder. Or, at minimum, run the frozen instruments as a drift check on every replication and report the result.

**0b. Pre-register continuous measures, not proportions. Binarising at n ≈ 48 throws the replication away.**

The emotional arc replication is the demonstration. Mean peak dominance 1.288 → 1.292, difference +0.004, CI [−0.126, +0.134]. Mean concentration 1.977 → 1.956. Immersive share .415 → .407. **Three decimal places, 96 manuscripts, two independent coder panels.**

All twelve binarised proportions derived from those same quantities returned "cannot distinguish."

**Every criterion in this document pre-registered proportions.** That was the wrong unit, and it explains why so much has come back as an underpowered null. The remaining criteria should register means with confidence intervals and treat any threshold-crossing rate as descriptive.

**0c. A hand-coded density is partly a fact about the coder. Normalise within manuscript.**

Between-coder variance is **47.3% of affective-event density in run 1 and 32.8% in run 2.** Per-coder means ranged 4.38 to 8.15. The arm difference sits inside coder-panel noise, and no number of manuscripts fixes it — only more coders per manuscript would.

**The measures that survive are the ones normalised within manuscript**: immersive share, concentration, dominance, all at r ≈ +0.73 across panels. Raw counts and densities are not comparable across arms.

Rule 0 said one reader coding twice replicates the corpus, not the rule. This is the stronger version: **even distributed coding does not fix a raw density, it only makes the unreliability measurable.**

**0g. The witnessability test is one rule serving three instruments. State it once.**

Interior versus exterior imperatives, object supplied, and cost named all reduce to the same question: **could someone other than the hearer tell it happened?**

They were derived separately across two criteria and written down as three definitions. Two of the three were then implemented as grammatical tests and both were wrong.

**The demonstration, 2 September.** Implementing `named_object` as "the ask has a direct object" returned **38 of 57 asks**. Implementing it as witnessability returned **6**. Six times the difference from a definition change alone, on identical manuscripts. The 38 included *"Do you know Jesus, who has become for us the wisdom of God?"* — a grammatical direct object supplying nothing. The 6 matched a hand audit exactly and held across three identical runs.

The corpus reads got this right by hand without stating the rule, because a human reading that sentence does not think an object was supplied. **Because the rule was never written down, anything implementing it from the reports will get it wrong.**

Same error had already occurred once, on interior versus exterior, and was corrected only when Chris supplied the principle directly: *"anything abstract like remember, consider, behold, stop trying to earn it is interior."*

**0d. A drift check on mechanical text properties does not detect a change in sample composition. These are different things.**

The redemptive movement replication ran ten frozen instruments code-blind over both full draws: every p > .069, max |z| = 1.82, the draws mechanically indistinguishable. **Meanwhile the genre mix had shifted from 11 epistles and 8 prophecy to 18 epistles and zero prophecy, and that shift flipped a correlation from −0.040 to +0.327.**

The pre-registration had explicitly forbidden reaching for "the draws differ on genre" unless the drift check supported it. The drift check could not have supported it, because it was measuring the wrong thing.

**Every drift check in this document has the same blind spot.**

**Demonstrated deliberately by the expository exultation replication.** Two draws 43 percentage points apart on genre, 18% epistle against 61%. Eleven frozen instruments, every one flat, max |z| = 1.64. Raw TEXT share fell 0.386 → 0.329, a 15% decline that the drift check would have licensed calling real. It was entirely composition.

**0f. Declare composition against every prior draw, pre-register the composition-predicted values, and post-stratify the primary outcome.**

The exultation pre-registration applied run-1 genre cell means to run-2's composition and wrote down what the numbers should be **before any coding**: TEXT share 0.302, grain 0.394, marked 0.375. Observed: **0.329, 0.390, 0.378.** Post-stratified to run 1's mix, TEXT share returns 0.406 [.344, .468] against run 1's 0.386 [.329, .442].

Three things prevented a false finding, in order: declaring composition directly rather than inferring comparability from mechanical flatness; pre-registering the composition-predicted values so the observed numbers could be recognised as arrival rather than decline; and post-stratifying.

**And a permanent gap: textual fidelity and pastoral specificity never saved their drawn file lists. Those four draws can never be composition-checked.** Every measures CSV from here carries the file list.

**0e. The physical-trace principle, narrowed: any relational component sinks an instrument, however small a share of the construct it is.**

The earlier version sorted constructs into surface and relational buckets. Too coarse. I9 was built as syntax plus lexis — Christ, a finite action verb, a hearer pronoun in the same clause, dependency-checked — and predicted to succeed at r ≥ +0.45. **It returned +0.309, firing 198 times against a hand count of 21.**

Nine-tenths of it is surface. The one-tenth that is relational, whether the thing acted on is *the hearer's named condition* established somewhere else in the sermon, sinks it. **The right question is not which bucket a construct is in but whether any relational component survives at all.**

**1. No tell ships from a single corpus read.** Two of the first three criteria produced a tell that failed on replication, and both failed backwards. Gospel clarity: Christ-in-genitive marks a reflexive move, reversed. FCF: a diagnosis rules out a wrong cure, reversed so hard that sermons with *no* fallen condition fire the test most often. One read produces plausible instruments; only a disjoint second read says which are real. This roughly doubles derivation cost per criterion and is not optional.

**The general failure mode, named by the FCF replication: the regex catches the construction without the function.** "Is not enough" is a sentence shape used constantly for non-diagnostic purposes. Every text-pattern instrument anyone builds on this product is exposed to this.

**2. Control for the book before claiming drift, and only when the sample supports a decomposition at all.** Book explains 20.7% of gospel vocabulary density variance; year explains 5.3%. After subtracting each book's own mean, the year effect is r = −0.023. A naive report would tell a pastor his gospel clarity collapsed in 2020 when he preached 1 Timothy. Replicated independently.

**But the FCF reads corrected this rule.** That decomposition ran on 439 machine-measured sermons. FCF ran on 53 and 60 hand-coded ones against 16 to 23 books, and the two samples pointed opposite directions: book 52% / year 29% in one, book 32% / year 47% in the other. Per degree of freedom the gap was trivial both times.

**A variance decomposition at n≈55 measures nothing.** Any Pro subscriber has dozens of sermons, not hundreds, so **no deep dive should attempt a variance decomposition at all.** Assume the book confound exists; do not try to quantify it at subscriber scale.

**3. Report failed instruments, do not drop them.** Both criteria produced instruments that returned nothing. Saying so is what makes the surviving findings credible, and it is the behavior to preserve in the productized version.

**4. Distinguish indicator from discriminator.** The named-object tell survives replication with r ≈ 0.24 to 0.30, under 6% of variance. That is enough to show a preacher as a pattern worth noticing. It is not enough to score on, gate on, or claim as a measure of anything.

**5. Where a finding replicates on one side and fails on the other, ship only the side that held.** The humor work is the clean case: crediting self-aimed humor is supported at phi ≈ 0.73 across two disjoint corpora and 1,757 coded instances; detecting trivializing humor is not, because both candidate predictors reversed sign between reads. **The rubric change is therefore one-directional.** Asymmetric conclusions are normal and should not be rounded into symmetric rules.

**6. The descriptive layer survives; the instruments mostly do not.** Across three criteria, modes, counts, position and ownership replicate. Mechanical proxies break. On FCF, three of four instrument legs reversed sign between samples. **The deep dive should be descriptive and quote-driven with counts. Instruments are a bonus, derived per criterion, and most will not survive.**

**7. A criterion yields a countable layer when the thing being measured leaves physical traces in the manuscript. Revised after the structure reads.**

The earlier version of this rule said the countable layer shrinks as a criterion gets more interpretive. **That was wrong.** Structure is no less interpretive than gospel clarity and it produced the best instruments in the study.

The real variable is residue. An unfinished conclusion leaves bare list items, ALL-CAPS label lines, placeholder tokens, and paragraphs without terminal punctuation, so TRD reaches ρ ≈ −0.42 on both runs. Load-bearingness leaves nothing on the page, so four instruments returned r between −0.09 and +0.04.

**Ask before spending a read: does this leave a mark a parser could find?** If not, expect modes and hand-coding, and do not force a Tier 1 that is not there.

**9. An open read produces inflated base rates, and the second read must be a random draw.** The ecclesial faithfulness v1 selected manuscripts partly *because* they were about the church: 1 Timothy 3, Matthew 18, Membership Sunday, the ordination, the Churchology series. A year-stratified random draw blind to content moved hearer-as-body from 70% to 58% and mutual asks from 32% to 16%.

**This reaches backward.** Application, gospel clarity, FCF and hard things were all open reads on both passes. Every base rate in those four is suspect in the direction of the criterion being studied. The direction of the conclusions survives; the magnitudes do not. Treat all pre-ecclesial percentages as upper bounds and re-derive any that a product decision rests on.

An open read is still the right *first* move, because you have to see the top of the range to know what the range is.

**10. Do not carry an instrument from one criterion to another.** The outline test runs 7:1 for gospel clarity and returns +0.009 and −0.051 across two ecclesial reads with headings present in 52 of 57 manuscripts. Structure means different things for different criteria. Every instrument is derived and validated per criterion.

**11. Pre-register the proportions, state the minimum detectable effect first, and do not read a null as confirmation.** The structure replication named eleven proportions in advance and tested each with a two-proportion z. The textual fidelity replication went further: a pre-registration document locked before any manuscript was opened, blind crux coding from passage references alone, a mechanical leak test that caught three near-duplicate manuscripts the index had mislabelled, twelve proportions, Fisher's exact where cells were small, and Holm–Bonferroni across all twelve.

**And it stated the minimum detectable effect in advance: 0.25 to 0.29.** Meaning the replication could detect gross failures and nothing else, and could not adjudicate a shift from 59% to 48%. It then said plainly that **non-significance is weak evidence of replication, not strong evidence.**

Every earlier criterion in this document quietly did the opposite, treating twelve nulls as confirmation. **This is the standard for the remaining four.**

**12. Surface an instrument as an invitation to look, never as a verdict.** TRD's false positives are diagnostic: seven sermons scored TRD ≥ 1 and hand-coded finished, and every one ends in an anaphoric cascade. The detector cannot distinguish a collapse from a crescendo because on the page they look alike. **The correct product behavior is "look at your ending," not "your ending is broken."** This generalizes to every instrument in this document.

**14. A perfect hand tell can be a poor instrument, and that is not a contradiction.** The correction move is present in 28 of 28 top-scoring manuscripts across two blind runs. A regex for it fires on 36% then 53% of them. The move leaves a trace on the page but not a lexically regular one. **Ship it as a self-check, not as a detector.**

**15. Base rates can be confounded too.** Load-bearing share came in at 50/50 on one sample and 75/25 on another, driven by the testament mix of the sample rather than by anything about the preacher.

---

## The template

Held across two criteria. Four parts fixed, return types variable.

| Part | What it asks |
|---|---|
| **Modes** | The recognizable ways a preacher executes this criterion. Multi-label per sermon. Descriptive, not evaluative. Honest at low n. |
| **Default** | What he does when he has not thought hard about it. |
| **Break-points** | Where he exceeds his own pattern, quoted, and what was different about those sermons. |
| **Tell** | A test he can run on his own manuscript before preaching. |

Plus, in every report: things not asked about, and hypotheses tested and rejected.

**Per criterion the schema needs one flag: is the core judgment precomputable, or does it require a read?** Application's is largely countable. Gospel clarity's central question, load-bearing versus removable, has no surface signature at all and must be hand-coded every time. That flag determines cost, latency, and which layer of the report the finding can live in.

---

## Application

Two reads. First pass 45 manuscripts, replication 44 disjoint, plus machine passes over 443 unique sermon endings.

### Modes, six

Gospel re-ascent. Diagnostic question volley. Petitionary volley (questions that are requests, softened so they can be declined; 4% of endings). Appended practical list. Domain sweep. Two-door split. Plus **the confessional application**, found only in the replication: the ask is aimed at the preacher in front of the room and the congregation overhears. Lowers the cost of the ask by paying part of it in public first.

### Default

A diagnostic volley folded into an upward gospel move, ending declarative. 86% of 443 endings close on a statement. Stated as doctrine in the earliest sermon in either set: *"That's what we need more than seven tips to a better home. We need to see Jesus."* (John 18, 2009.)

### The tell, three binary markers

**Object supplied.** Does the ask name its own direct object, or hand the hearer a verb and leave the object blank.

**Cost named.** Does the ask acknowledge it will cost something.

**Objection anticipated.** Does the ask argue with someone who does not want to do it. Generic application never carries a caveat, because nothing has been asked that anyone could resist.

**Grammatical form is not the variable.** Mark 10 (2017) contains fifteen fully concrete applications delivered as questions and four grammatically imperative ones that are practically empty, forty lines apart. Any implementation treating imperative mood as a proxy for concreteness is wrong, and that sermon is the test case.

### Countable metrics, thirteen

Explicit application label. Bolt-on numbered list. Domain sweep (4+ spheres). Diagnostic question count. Quantity present. Final sentence type. Gospel recap position. **Interior-to-exterior imperative ratio** (1.61:1 home pulpit; the single number that captures the whole "grace declared more than grace applied" finding). Negative-to-positive imperative ratio (0.79:1). Longest list. Named outside author in close (11%). Physical in-room instruction ("write down", all instances 2019+). Unfilled template slot.

### Corrected on replication

Re-preaching does **not** make application more interior. On 22 re-preach pairs, median closing similarity is 84% and 36% are ≥90% identical. Re-preaching usually changes nothing, and when it does change something it gets *more* directive. The first read's claim rested on a single pair.

### Other findings

**Venue effect.** Guest pulpit endings are roughly 4× more behavioral than home pulpit. n=24 and regex-detected, so directional only.

**Jurisdiction, not imperative mood.** Specificity appears when a legislating text concerns something inside the church he leads. Outside that jurisdiction he abstracts, even on the densest case law in the Bible.

Full spec at `claude/spec-application-measurement.md`.

---

## Gospel clarity

Two reads. First pass 44 manuscripts, replication 55 disjoint, machine passes over 439 to 442 unique sermons.

### Modes, seven

Zoom out to the metanarrative. Christ occupies the role. The demand exposes, Christ supplies. Build the problem, let the cross resolve it. The guardrail (defensive insertion after pressing on obedience; 3% of files). The transplant (import an NT gospel passage whole; Romans 3, Romans 8, 1 Cor 15, 1 Cor 10 are the recurring donors). The counterfactual (rare, 2 of 44).

### Default

**Not a route. A tag.** A single appositive sentence attaching the cross to a noun the sermon was already using, usually *the church*, *the mission*, or *God's glory*. Grammatically a modifier: delete it and the sentence stands unchanged.

### The central judgment: load-bearing or removable

**Coding rule.** Load-bearing means that if every gospel sentence were deleted, at least one claim the sermon makes becomes unsupported or false. Removable means every claim survives and the gospel supplied motive, warmth, or a closing frame but no premise.

**It has no surface signature.** Four mechanical instruments were built and validated against hand-coding: causal-connective proximity (r = −0.09), second-person consequence (r = +0.04), appositive construction (r = −0.03), passion-narrative detail density (r = +0.22, the only one with any signal). **Load-bearingness must be hand-coded. Any claim about it produced without reading the sermons is unsupported.**

Counts: 21/22 on the first sample, 41/14 on the second. The gap is the sampling caveat, not a contradiction: the second set was 84% New Testament and 15% denser in gospel vocabulary.

### The instruments that worked

**Test 1, the outline test. Strongest instrument found across either criterion.** Does any numbered main point contain a gospel word? 20 of 41 load-bearing sermons do; 1 of 14 removable ones does. Seven to one on the binary.

Structural rather than textual, computable in milliseconds, legible without explanation, and it converts directly into an instruction: put the gospel in a main point, not in a paragraph. **Requires a manuscript with an outline; does not exist for transcript-only users.**

**Test 2, the named direct object.** In a live move the cross has a named object: wrath, the curse, the penalty, the debt, the grave. In a reflexive move the object is "sins" with no content given to it, or there is no verb because the gospel hangs off a noun. 7.4× separation, r = +0.295, and it survives normalization per gospel token (r = +0.237), so it measures the shape of gospel talk rather than the amount.

### Failed on replication

**Christ-in-genitive as a marker of reflexive moves. Fails, and backwards.** Genitive runs 0.461 per 1k in load-bearing sermons versus 0.154 in removable, r = +0.404. *The blood of Christ*, *the cross of Christ* is simply how he talks about the atonement when he is talking about it at all. Narrative tense per gospel token is slightly *more* common in removable sermons, since the closing pivot is itself narrative. Only the narrative-to-genitive **ratio** partially survives, weakly (r = +0.206).

### Also failed

Position predicts load-bearing (r = +0.038, uninformative). Sermons addressing a non-Christian have more load-bearing gospel (55% vs 47% on n=43, not a finding). Concrete application requires load-bearing gospel (the two most concrete applications in the corpus sit on opposite sides).

### Countable metrics

Passion-narrative detail density (1.34 vs 0.26 per 1k, load-bearing vs removable). Named-object construction rate. Non-Christian address presence and position. Gospel material centroid. Core vocabulary density (**only meaningful book-controlled**).

### Non-Christian address

Present in 17% of 443 sermons on the first sample, 25% of 55 on the second, communion-fencing excluded. **Median position 91% and 88% of the way through the manuscript.** A closing gesture, not a running assumption.

What is asked of him, tallied: warned of judgment with no verb given, 13. Believe, 12. Repent, 8. Pray, 5. Follow, 4. Consider, 3. Trust, 1. **Take a physical step, 1, in the whole corpus.** This maps directly onto rubric question 3 and is countable.

---

## Fallen Condition Focus

Two reads. First pass 53 manuscripts hand-coded, replication 60 disjoint. Chosen because it is double-weighted, because the retrospective made a checkable claim about it, and because it lives in the sermon's setup rather than its landing or argument.

**The four-part frame held on a criterion living in a different part of the sermon. It is a template, not an artifact of where the earlier reads happened to look.**

### Is a condition named at all

| | replication (60) | first (53) |
|---|---|---|
| present and explicit | 27 (45%) | 27 (51%) |
| present but implied | 26 (43%) | 20 (38%) |
| absent | 7 (12%) | 6 (11%) |

Close replication. Five of the seven absent cases open with something that is not about a person: a film clip, a plot summary, a two-point outline, a cold Scripture reading.

### Kinds of condition, seven

Guilt and sin's residue. Drift and dullness. Self-deception and earning. Misplaced hope. Suffering. Cultural or general disorder. Plus, from the replication, **exhaustion and disillusionment with God's own promises**, which produced the best single FCF sentence in either sample (2 Cor 4:7–15, 2017, the Sunday after a funeral).

### Whose condition

| owner | replication (of 53) | first (of 47) |
|---|---|---|
| the people in the room | 28 (53%) | 29 (62%) |
| a general truth, no owner | 22 (42%) | 14 (30%) |
| the original audience of the text | 2 (4%) | 2 (4%) |
| the preacher | 1 (2%) | 2 (4%) |

**The expected failure mode is not the real one.** Parking the condition with the biblical audience happens in two sermons out of sixty, twice. The real failure mode is **the ownerless condition**: stated with an unspecified plural that never resolves into anyone.

**The most stable finding in this criterion, replicated at 80% and 77%:** when the condition is stated explicitly it is almost always hearer-owned; when it is left implied it usually belongs to no one.

### Position

Early 62% and 68%. Threaded 25% and 15%. Application-only 13% and 17%. Early placement is the norm in both samples.

### The tell: withdrawn

**First read proposed:** a diagnosis rules out at least one wrong cure and says why it fails. Best-performing instrument in that sample, r = +0.271 with explicitness, +0.243 with hearer-ownership.

**Replication: fails backwards.** Explicit 7%, implied 8%, **absent 43%.** r = −0.120 with explicit, −0.236 with hearer-ownership. Withdrawn.

**The only leg that held twice** is weaker and narrower: a second-person sentence about something wrong with the hearer, inside the opening fifth of the manuscript. r = +0.206, then +0.286.

> Read your first two pages. Is there a sentence with *you* or *we* as the subject and something wrong as the predicate? If not, you have not named a condition, whatever else the introduction is doing.

Three of four instrument legs reversed sign between samples. **FCF quality is not reliably machine-detectable at these sample sizes.**

### The prior claim, split, twice

**First half survives strongly.** Of the manuscripts carrying a labeled `PROP:` or `BIG IDEA:`, ten of eleven in the first sample and nine of eleven in the replication are a truth about God, a truth about a practice, or an imperative. **The controlling line is almost never a diagnosis of the listener.**

Structural confirmation across all 868 files: `PROP:` appears in 88, `BIG IDEA` in 88, **`FCF:` in 6.**

**Second half fails, twice.** The condition does not surface only in the final application. 62% and 68% appear in the introduction.

**The accurate reconstruction:** the condition is named early *and* a truth about God controls the sermon. They live side by side rather than one governing the other. The visible seam is a hybrid main point where the condition appears as a prepositional object and God is the grammatical subject: *"God speaks comfort into our hopelessness."* The condition is present and hearer-owned. It is just never the subject of the sentence.

**And both diagnostic controlling lines across both samples come from warning literature.** Ecclesiastes, Hebrews 6, Hebrews 10. When the text's own thesis is a diagnosis, his becomes one.

### Countable

Essentially one weak instrument, plus the label counts (`PROP:` / `BIG IDEA` / `FCF:`). This is the thinnest Tier 1 of the three criteria read so far.

---

## Hard things handled

Two reads. First pass 50 manuscripts, replication 66 disjoint. 1,757 humor and disclosure instances individually coded across both.

### Softening moves, eight plus three

Narrow or redefine. The immediate pivot. Announce the difficulty. Relocate to them. Pre-empt the objection. The borrowed voice. The skipped scene. Generalize to "we." All eight replicate; the replication found three more and found the skipped scene far more common than v1 did (45 of 66 against 6 of 50), which is the largest single disagreement in the softening inventory.

### The humor hypothesis

**Claim tested:** humor and self-disclosure are the same move seen from two sides; a human moment costs the preacher and lowers him toward the room, a trivializing one costs the text and lowers the subject. Coded on two independent axes, what it is aimed at and what it costs.

**This is the best-powered finding in the whole derivation work.**

| | v1 (580 instances) | v2 (1,177 instances) |
|---|---|---|
| phi(aim = SELF, cost = PREACHER) | **+0.719** | **+0.743** |
| Cramér's V, aim × cost overall | 0.675 | 0.726 |
| Share of corpus in the two predicted cells | 28% | 30% |
| Self-aimed instances that cost the preacher | 60% | 62% |
| phi(aim = SELF, hard context) | −0.135 | −0.161 |

**Replicated, strongly:** self-aimed humor costs the preacher. Treat it as evidence of pastoral warmth.

**Also replicated:** the two axes do not collapse into one. Self-disclosure splits roughly two to one, so about a third of it is warm stories in which the preacher comes off fine and nothing is paid. Self-disclosure is faintly repelled by hard material.

**Failed, and it is the half that matters for scoring:**

| | v1 | v2 |
|---|---|---|
| phi(aim = TEXT, cost = TEXT) | +0.310 | **+0.579** |
| phi(sits inside hard material, cost = TEXT) | **+0.744** | +0.202 |

They swap. v1 concluded position predicts cost to the text and direction does not; v2 found the reverse. Both rest on one subjective judgment, whether an instance costs the text, and the hard-context base rate differed between coders, 39% against 51%. Widening that net sweeps in costless instances and collapses the correlation mechanically.

**Neither is stable enough to ship. Trivializing humor is not reliably detectable.**

### The product consequence, and it is a rubric change

**Credit self-aimed humor. Do not attempt to flag trivializing humor.**

Any scorer that tries will be guessing, and guessing in a way that penalizes a genuine strength. Trivializing belongs to the reverence check on the prep card, which is a question a preacher asks himself, not a judgment a model renders.

### Two categories the hypothesis could not see

**Aim at the room, cost to nobody: 254 instances, 22% of the corpus, the largest single cell.** Domestic observational asides that name no one and charge no one. The refrigerator at 9pm, the peanut butter lid, the toilet paper roll. It neither lowers the preacher nor the text; it holds the room. **The most common thing his wit does was invisible to a two-sided frame.**

**The absent third party: 40 instances in v1, 136 in v2, phi = +0.875, the tightest association in either table.** Megachurches, prosperity preachers, K-LOVE, Word of Faith, Mormons, the pastor who would not read books by women. These lower neither the preacher nor the text. **They raise the room by giving it someone to be unlike.**

That is not a humor finding. It is an ecclesial one, and no rubric criterion currently measures it. **Carry it into the ecclesial faithfulness read rather than filing it here.**

### Unresolved hard things

89 instances across 42 of 50 sermons in v1; 336 across all 66 in v2. Every manuscript in the replication set contains at least one. Three kinds, with ABANDONED the largest: raised, then the manuscript moves on.

### A retrospective claim falsified

**"My weakest exegesis happens under occasion pressure" fails in both reads.** v2 could not even rebuild v1's instrument for it. Second confident claim from the 18-year retrospective to go down.

---

## Ecclesial faithfulness

Two reads. First an open read of 61 manuscripts, then a **year-stratified random draw of 57**, blind to content, with a per-book cap. The method change is the most important result in the pair. See rule 9.

### Modes and base rates

| | open read (60) | random draw (57) |
|---|---|---|
| hearer = body | 42 (70%) | **33 (58%)** |
| hearer = individual | 14 (23%) | **24 (42%)** |
| actor = mutual | 19 (32%) | **9 (16%)** |
| actor = mutual or mixed | 25 (42%) | **18 (32%)** |
| actor = individual | 34 (57%) | **35 (61%)** |
| actor = none, no ask at all | 1 | **4** |

**Coding rule.** Body = the sermon asks for something whose object is another person in that congregation, or addresses the congregation as one entity with a shared record, or treats named in-room structures as facts the hearer is already inside. A corporate vocative alone does not qualify. Actor = individual if a person could obey and never return; mutual if obedience requires someone else in that room.

### The plurals do not stay plural

The sharpest case: a commentator is quoted arguing an imperative is corporate, the argument is endorsed, and three private disciplines are handed out (Phil 2:12-13, 2017). A sermon on a church split applied privately (Acts 15:36–16:40, 2023). A sermon on confession of sin that names the horizontal damage, produces the list of people harmed, then runs confession exclusively upward with James 5:16 never appearing (Psalm 32, 2012). Baptism handled as private union-with-Christ metaphor with the community group explicitly demoted (Rom 6, 2015).

### The tell

**Mechanical, revised:** RI, a reciprocal-object noun ("one another," "each other," "the body," "your brother," "someone in the church") within roughly 110 characters of an imperative, **anywhere in the manuscript.** Pooled r ≈ +0.56 against mutual asks.

**v1's tail restriction was wrong.** Restricting to the final 20% loses on every column. Mutual asks are not reliably last: 2 Cor 8 scores zero on the restricted version while carrying its entire reciprocal ask at 50 to 70% depth.

**Human tell, unchanged across both reads:** take the application block and ask of each item, could a person obey this and never come back? Run it on the whole manuscript, not the last page, and count a "this isn't the main point, but" clause as a miss.

### What ships

RI (pooled ≈ +0.56). Churchword density (+0.563 body, +0.641 mutual). EFI ≥ 4 as a **positive-only** signal: precision 1.00 in both reads, recall 0.15. A perfectly precise, low-recall instrument is usable for confirming, never for denying.

### What failed

| instrument | open read | random draw | verdict |
|---|---|---|---|
| `"our church"` present | phi +0.509, prec 0.93 | **phi +0.118, prec 0.60** | failed; tracks venue, not address |
| membership density | +0.442 | **+0.075** | failed; artifact of purposive sampling |
| ordinance density | +0.226 | **−0.027** | dead |
| in-room deixis | −0.027 | **−0.098** | dead in both |
| the outline test | +0.089 / +0.144 | **+0.009 / −0.051** | dead in both. See rule 10 |
| structure index | +0.040 | **+0.452** | reversed; unshippable either direction |

### New instrument: church language is edge-loaded

The first read tested front-loading with a positional centroid and rejected it. **The centroid was the wrong statistic**: material clustered at both ends produces a middling centroid. Measured as edge-share, the proportion of church-words in the first or last 12% where chance is 0.24:

**Mean 0.515, median 0.483, roughly twice chance, above chance in 38 of 54 manuscripts.**

**The church lives in the announcements and the dismissal.** Haggai 1's densest ecclesial material sits after the benediction. Easter's only institutional act is an RSVP reminder. Consequence nobody asked for: a hearer who arrives late or leaves early hears a materially less ecclesial sermon.

### The cleanest result in either read

**Eleven of eleven sermons with a calendared institutional event are coded body. Zero exceptions in 57.** phi +0.417. Composite furniture density 4.14 with an event against 1.37 without, a 3.0× gap; structure-word density 11.5×.

This confirms the replacement for the jurisdiction hypothesis proposed under application. **Specificity tracks a calendared institutional event, not jurisdiction.** The room, not the text, produces the ecclesiology.

### Also replicated

Household segmentation by domestic role, far more than by church office. Away pulpits preach office more and reciprocity, ordinance and discipline less, with four of six ratios replicating within 0.1, though the venue sample remains underpowered.

---

## Structure

Two reads, 48 then 47 usable manuscripts, 95 distinct. **The first properly designed replication in the study:** eleven proportions pre-registered and tested run-1-against-run-2 with a two-proportion z. **Not one exceeded ±1.96.**

### Pooled findings, n = 95

- **73% derived, 27% imposed**
- Median 3 points, mean 3.02, mode 3; 71% carry two or three
- 58% carry a controlling image
- 86% of introductions are finished prose; **39% of conclusions are**

### The near-law

**Fifty-one sermons have a finished introduction and an unfinished conclusion. Six have the reverse. McNemar χ² = 34.0, df = 1, p < 0.001.**

The strongest empirical finding in the entire derivation work. The 18-year retrospective called this a craft gap; it is closer to a structural law of this corpus.

### The instruments that work, and they are the first stable ones in the study

**TRD, Terminal Residue Detector.** Last 15% of the manuscript by word count; +1 for each of: two or more bare list items ≤10 words with no terminal punctuation; two or more ALL-CAPS `LABEL:` lines; a final paragraph not ending in terminal punctuation; a placeholder token (`Ills`, `XXXX`, `STORY OF`, `ADD`, `PREACH GOSPEL`, `ILLUSTRATION`, `NEW PROP`); a final paragraph ≤6 words.

**ρ = −0.423 and −0.424.** Three-decimal agreement across disjoint samples. Precision 0.72/0.75, recall 0.75/0.70.

**Its false positives are diagnostic, and this is a product design constraint.** Seven run-2 sermons scored TRD ≥ 1 and hand-coded finished; every one ends in an anaphoric cascade. The detector flags both terminal modes, the collapse and the crescendo, because on the page they look the same. **A TRD hit means "look at the ending," never "the ending is broken."** See rule 12.

**L6, prose ratio of the last six non-scripture paragraphs.** ρ = +0.297 then **+0.508**, monotone ordering exact across finished / semi / unfinished. Combined as `TRD − 2·L6`: ρ = −0.416 then **−0.471**.

### Instruments that failed

Same 2 / 1 / 5 split across both runs, and **the same two worked.** Two new instruments built for run 2 both failed, one by reversing sign.

| instrument | verdict |
|---|---|
| TPR, prose ratio of terminal 12% | +0.159 → +0.543. Unstable. Use L6, same idea with a stable denominator |
| GAP, head prose ratio minus tail | **fails both runs** (−0.146, −0.230). The mechanical version of the near-law does not reach significance even though the hand-coded version is p < 0.001 |
| LSS, last-section length share | fails both |
| AGREE / LCS, first-word concordance across point heads | fails both |
| VDI, vehicle dispersion | fails both |
| INX, inclusio flag | no discrimination |
| TAILANCH, unanchored last head | new in run 2, **reversed sign** |
| RENUM, point-numbering instability | new in run 2, sign flips between runs |

**GAP is the important failure.** A finding can be a near-law by hand and still resist the obvious mechanization of itself. TRD and L6 get at the same thing by a different route.

### The tell: the Frame-Break Test

The best human tell produced across seven criteria.

> **Write your point heads in a column. Find the one that does not fit the grammatical pattern of the others. That is the point the text did not give you.**

Verified on every mixed-origin manuscript in run 2. The Acts 4 case survived nine years and a full re-preach unrepaired, because it is not a mistake: it is an accurate signal that the third item is a different kind of item.

**The decision rule both runs support:** does the *order* of my points come from somewhere other than my own convenience? Pooled, only 1 of 26 imposed structures is sequential.

### A negative finding with a rubric consequence

**The controlling image measures nothing.** It carries in 59% of derived sermons and 54% of imposed ones. It feels like structural conviction and does not track it.

### Two things that did not replicate

**The coder's own hand.** Argumentative transitions coded at 10% in run 1 and 34% in run 2, z = −2.77. The corpus did not change. Reported openly by the second read, which is the behavior to preserve.

**The labelled proposition.** `PROP:` or `BIG IDEA:` on its own line in 5/48 then 11/47, with near-identical year strata. Unexplained, and reported as unexplained rather than decomposed.

---

## Textual fidelity & exegesis

Two reads, 46 then 48 manuscripts. **The best-executed pair in the study.** Pre-registration locked before any run-2 manuscript was opened; blind crux coding from passage references alone; seed and draw fixed in advance; a mechanical containment test that caught three near-duplicates the index had mislabelled; twelve proportions with Fisher's exact and Holm–Bonferroni; power stated up front.

### The headline: the mode collapse is the scorer, not the preacher

Production scores criterion 1 as a **4 on 137 of 172 sermons, an 80% mode**, and it carries the lowest standard deviation in the rubric at 0.397.

Hand-coding the corpus gives a real range, and run 2 is **flatter** than run 1:

| | run 1 | run 2 |
|---|---|---|
| TD = 4 (mode) | 27/46 = 59% | **19/48 = 40%** |
| TD = 5 | 11/46 = 24% | **17/48 = 35%** |
| TD ≤ 2 | 3/46 = 7% | 5/48 = 10% |

**Criterion 1 is failing to discriminate a range that is demonstrably present.** Its low standard deviation is a property of the instrument, not of the preacher. Anything resting on that figure, including criterion 1's gate in the criterion table, is measuring the scorer's collapse.

### The finding: 28 of 28

**Every TD-5 manuscript in both runs contains a correction move**: a sentence where the text pushes back on the preacher's own expectation and the pushback is written down. Eleven of eleven, then seventeen of seventeen, across a blind disjoint pre-registered draw.

> *"YOU WOULD THINK THAT THE NEXT THING HE WOULD SAY IS SOMETHING LIKE THIS: ... GIVE THEM MORE LAW! SCARE THEM INTO OBEDIENCE. But it doesn't say that --- it actually says the opposite."* (Hebrews 12:18-29, 2022)

**Nothing else in seven criteria comes close to 100% across two blind runs.**

**But the regex catches barely half.** CORR fires on 4/11 then 9/17 of TD-5 sermons. See rule 14. Ship as a self-check, never as a detector.

### H3, corrected rather than broken

Run 1: a passage with no crux never produced top work, 0 of 13. Run 2: 1 of 9. Fisher p = .020 then .065.

The single exception, 1 Cor 1:18-31 (2018), is the only TD-5 in either run that works **zero** cruxes in the open. Its rigour comes from tracking the argument clause by clause instead.

**Corrected claim, narrower and more useful:** a crux-free passage cannot reach the ceiling *by the route normally used*. Sixteen of seventeen run-2 fives work at least one crux in the open. A claim about method, not capacity, and it survives both runs.

### The twelve tests

Smallest p is P7 at .042, Holm threshold .00417. **No test survives correction. Nothing fails to replicate.**

P7 directionally undercuts run 1's claim that exposition holds more often than it thins (10/18 vs 5/21). The report declines to act on it, since it is the one proportion whose measurement had to be rebuilt. **The correct current statement is weaker: exposition holding across the whole passage is a minority behaviour in both runs, and the two runs disagree about how large a minority.**

### Also replicated

Crux worked in the open: 70% then 73%. Occasion/topical sermons scoring TD ≤ 3: 50% then 58%.

---

## Pastoral specificity

Two reads, 47 then 46 scored. Pre-registered with a stated MDE, three-layer mechanical disjointness, a byline screen after run 1 found another preacher's manuscript in the frame, and instrument predictions locked in advance.

### The twelve tests

**Nothing clears Holm. Nothing clears α = .05 uncorrected. Smallest p is .054.**

The design could only detect shifts above roughly a third, and the pre-registration said so before the draw. **Four proportions moved 15 to 25 points in a consistent direction** — P1, P8, P9, P12 — and the drift diagnostic argues that direction is a coding artifact rather than a property of the corpus. See rule 0.

### HB: the most robust finding on this criterion

**Zero of 154 local namings across two runs carries a fault valence.**

| valence of LOCAL namings | run 1 | run 2 | both |
|---|---|---|---|
| PRAISE | 26 | 19 | 45 |
| NEUTRAL | 71 | 31 | 102 |
| TROUBLE | 1 | 6 | 7 |
| **FAULT** | **0** | **1** | **1** |

The single fault-valenced naming in 154 is the preacher himself, in a story about gaming a teacher for money (Philippians 2, 2017). **Nobody in the room is ever named in fault from this pulpit.** Two independent draws, sixteen years, mechanically countable.

### The calendared-event hypothesis is dead here

| | run 1 phi | run 2 phi | pooled n = 93 |
|---|---|---|---|
| calendared institutional occasion | +0.062 | **−0.093** | .540 vs .535, p = .96 |
| disturbance in the congregation | +0.324 | +0.114 | .765 vs .487, p = .038 |

**27 of 50 with an event, 23 of 43 without. Half a percentage point across 93 manuscripts.** The firmest negative finding in the project.

**This narrows the ecclesial faithfulness result rather than contradicting it.** A calendared event makes the preacher preach *about the church* (11 of 11 coded hearer-as-body). It does not make the sermon *know who is in the room*. Different criteria, and the finding belongs to one of them.

**HA halved** (+0.324 → +0.114, n = 8 in run 2; pooled p = .038 uncorrected). Directionally consistent twice, never strong twice. **Treat trouble-predicts-specificity as a live hypothesis, not a finding.**

**HC replicates:** in-room material is not front-loaded. Median position 0.579 then 0.514.

### The tell, now a one-way screen

Two markers: (1) a fact about a person in this room the preacher could only know because he was told or watched it; (2) an ask naming a cost that falls on some people in the room and not others.

| | run 1 | run 2 |
|---|---|---|
| both markers → SPECIFIC | 10/11 = .909 | 8/8 = 1.000 |
| neither marker → SPECIFIC | 4/17 = .235 | **12/25 = .480** |

The ceiling held perfectly and means little at n = 8. **The floor moved 25 points, which is exactly where coder drift would show.** Passing both markers is good evidence. Failing both is now weak evidence of anything.

### Run 1 corrected

Run 1 wrote "you will name the doubting, you will rarely name the bereaved." **Wrong — run 1's draw simply missed the grief.**

---

## Emotional arc and dynamics

Two reads, 49 then 47 scored. **The most rigorously designed pair in the study.** The ordinal was never assigned by a human: coders applied seven point-at-it type tests to spans with verbatim quotes and offsets, and a script computed the score. Twelve manuscripts double-coded per run. Frozen instruments run code-blind over both full draws before any run-2 coding.

### The question that prompted the read, answered

Production gives criterion 8 **three 5s in 169 scores, a 2% ceiling rate**, against 10% to 48% on every other criterion. I expected the mirror of criterion 1: an unreachable ceiling.

**It is not. The corpus really is flat.**

Pooled n = 96: peak dominance **median 1.20**, 65 of 96 (68%) under 1.35. Decile profile `.114 .074 .077 .095 .106 .098 .106 .103 .107 .120` — flat with a small bump at each end. **Six of 96 are architecturally shaped, one in sixteen.**

Six percent shaped against a two percent five-rate is closer to calibrated than broken. **A negative result, and worth having, because the prediction was the opposite.**

### What replicated: the continuous measures, to three decimals

| measure | run 1 | run 2 | difference | 95% CI |
|---|---:|---:|---:|---|
| mean peak dominance | 1.288 | 1.292 | **+0.004** | [−0.126, +0.134] |
| mean concentration | 1.977 | 1.956 | −0.020 | [−0.173, +0.132] |
| immersive share | 0.415 | 0.407 | −0.009 | [−0.059, +0.041] |

All twelve binarised proportions of these same quantities: **cannot distinguish.** See rule 0b.

### The reliability finding

| measure | run 2 r | run 1 r |
|---|---:|---:|
| immersive density | +0.834 | +0.737 |
| immersive share | +0.739 | +0.732 |
| AE count | +0.578 | +0.580 |
| AE density | +0.505 | +0.679 |
| concentration | +0.487 | +0.714 |
| **peak position** | **+0.096** | +0.405 |
| peak section, exact | 5/12 | 5/12 |

**Between-coder variance: 47.3% then 32.8% of affective-event density.** See rule 0c.

**The stinginess direction is not a stable coder property — it flips.** Run 1's duplicate panel found 12.7% fewer events than the primary; run 2's found 7.7% more. Not a bias that can be corrected for.

### Peak location is dead

Inter-coder +0.096 on position, 5 of 12 on section, in both runs. **Everything in run 1 depending on peak location is struck.** The location of a sermon's emotional peak is not a measurable quantity with this codebook.

### Instruments: both of run 1's headline results fail

**DRIFT** (max adjacent-decile sentence-length change), registered as likely to fail, then succeeded at ρ = +0.445 — comes back at **−0.254.** Reverses sign.

**The earnest-versus-moving tell**, run 1 §10, ρ = −0.354 against concentration — now **+0.058.** Withdrawn. Do not use it.

### The free between-preacher control

The byline screen failed. `Sunday Messages/Ecclesiastes/Ecclesiastes1.md` is **Ray Ortlund, Jr.**, filed as Chris's. The primary coder read the author block and recorded the screen clean; the duplicate coder caught it. **False-negative rate 1 in 1 on the only case available, rescued only by redundancy. This file has now contaminated two studies in this project. Rename or delete it.**

Coded anyway as the only between-preacher data point in the project:

| | Ortlund | pooled corpus | percentile |
|---|---:|---:|---:|
| AE density /1k | 4.42 | 6.07 | 16th |
| immersive share | 0.17 | 0.411 | 1st |
| peak dominance | 1.00 | 1.29 | bottom |
| **all-caps emphasis /1k** | **0.0** | 11.9 | **0th** |

n = 1, and the extraction is a per-line PDF with hard wraps that may suppress the sentence-length counts. **The one unambiguous number is CAPS = 0.0. The all-caps habit is not a feature of the genre; it is Chris's.**

### Fourth independent confirmation

The intro-finished / conclusion-unfinished asymmetry: **48 vs 10, McNemar χ² = 23.6, p < 0.001.** Fourth draw. **The most replicated finding in the project.**

### Run 1 corrected by re-running its own code

"Dominance ≥ 1.5: 9 of 49; both: 5 of 49 (E01 E09 E21 E37 E41)" → **10 of 49 and 4 of 49 (E01 E09 E21 E26).** E37 at 1.17 and E41 at 1.25 never met the threshold. "Roughly one sermon in ten is architecturally shaped" becomes, pooled, **one in sixteen.**

---

## Christ-centered / redemptive arc

Two reads, 56 then 55, plus **the project's first census: all 497 usable manuscripts, 4,227 numbered outline points.** Fenced against gospel clarity by construction: this criterion measures the *motion* of the sermon, not the content of its gospel material, and decomposes into location, carry, and agency so the three can dissociate.

### The first instrument in the project to survive twice at the same magnitude

| instrument | run 1 | run 2 | pre-registered | verdict |
|---|---|---|---|---|
| **I1 SUBJ** dependency parse vs hand agency | **+0.925** | **+0.903** | succeed | **survives twice** |
| **I2 LOCUS** lexicon vs hand locus count | +0.539 | +0.518 | succeed | **survives twice** |
| I2S locus spread | +0.380 | −0.023 | secondary | reverses |
| I3 BRIDGE | +0.096 | −0.117 | fail | fails twice, as predicted |
| I4 SWING | +0.155 | −0.095 | fail | fails twice, as predicted |
| I6 TENSE | +0.170 | +0.195 | fail | fails twice, as predicted |
| I8 condition/rescue overlap (new) | — | +0.130 | fail | fails, as predicted |
| **I9 mechanical tell (new)** | — | **+0.309** | succeed, ≥ +0.45 | **fails its prediction.** See rule 0e |

**And the reliability behind I1 is unlike anything else in this document: 520 span labels across two runs and two independent panels, κ = 1.000 both times.** Whether Christ is the grammatical subject of a finite action verb is a determinate fact that two readers and a parser recover identically.

That number sits in the same report as a measure with ICC −0.36, which is the point.

### Six of nine continuous measures replicate

| measure | run 1 | run 2 | verdict |
|---|---|---|---|
| **agency (prose)** | 0.185 | 0.168 | **replicates** |
| pre-close agency | 0.854 | 0.891 | replicates |
| CARRY | +0.070 | +0.076 | replicates |
| locus count | 5.48 | 5.35 | replicates |
| locus spread | 10.09 | 9.82 | replicates |
| **middle-share** | 0.233 | **0.237** | **replicates — four thousandths apart on disjoint material** |
| agency centroid | 0.638 | 0.528 | fails low |
| built-share | 0.694 | 0.762 | fails high |
| Christ-density /1k | 7.16 | 8.92 | fails high |

**Pooled n = 111:** agency 0.176 [0.148, 0.205] · locus count 5.41 · middle-share 0.235 · carry +0.073 · cross named 109/111 · zero Christ-action in own prose 21/111 · Christ-acts-on-our-trouble 44/345 = .128.

### The census

Run 1's most-quoted number was "0 of 379 numbered main points has Christ as the subject of an action verb." Run 2 broke it, then settled it with a census rather than a sample.

| | count | share |
|---|---|---|
| outline points, whole corpus | 4,227 | — |
| points naming Jesus / Christ / Messiah | 291 | .069 |
| **points where Christ is the grammatical subject of a finite action verb** | **21** | **.0050** |
| **manuscripts containing at least one** | **10 of 497** | **.020** |

**One outline point in two hundred; one manuscript in fifty.** And the 21 cluster: three sermons supply eleven of them. When it happens, a Christ-agent frame has been chosen and the whole outline runs off it. The other 487 do not.

Note the control line: 6.9% of points name Christ corpus-wide against run 1's sampled 6.9%. **The sample was right about how often Christ appears in the outline and wrong to say never about how often he acts there.**

### H1 failed, and the repaired claim is better

H1 was load-bearing: Christ-density and agency uncorrelated, |r| < 0.25. Run 1 **−0.040**. Run 2 **+0.327, p = .0148. Fails.**

| | run 1 | run 2 | pooled |
|---|---|---|---|
| raw density vs agency | −0.040 | +0.327 | +0.136 (p = .16) |
| **genre-centred partial** | −0.133 | +0.147 | **+0.009 (p = .93)** |

The run-2 correlation is **entirely between-genre.** Gospel narratives are dense in Christ and high in agency because Mark and John supply both; wisdom is low in both because Ecclesiastes supplies neither. Run 2 was gospel-heavy.

**Repaired claim: within a genre, how much you talk about Christ tells you nothing about whether he acts.** Run 1's clean null was partly luck — its genre mix happened to cancel.

### Retired for good

**Built-versus-asserted** (ICC +0.72 then **−0.36**) and **condition-answers-rescue** (κ +0.33 then **−0.07**, and the repaired v2 rule made it worse). Both are relations between spans, both failed their pre-registered reliability floors twice, both closed rather than carried into a run 3.

### Genre drives this criterion hard

Run 1 found no genre effect (agency F = 1.14, p = .35). Run 2 found **F = 5.58, p = .0025**, with gospel narrative running roughly double wisdom. Run 1's null was underpowered at n ≈ 8–11 per cell, not a real absence.

### Housekeeping

`Ecclesiastes1.md` (Ray Ortlund) was drawn for a **fourth** consecutive study, and `Sunday Messages/Psalm 32.md` (a seminary paper) for at least a second. Neither is caught by any screen. Both had to be pulled by hand again.

---

## Expository exultation

Two reads, 44 and 44, plus a retrospective composition audit of run 1 against every prior draw in the project. **The methodological capstone.**

### Tier 1 is not null

Registered in advance that a null Tier 1 would be surprising, so a positive one could not be claimed as a discovery. Exultation appears in **every manuscript in both runs.** Affect is lexical and it is on the page.

### The grain tell — the first hand judgement in this project to replicate at magnitude

| | run 1 | run 2 |
|---|---|---|
| **φ** | +0.715 | **+0.726** |
| P(TEXT \| a textual object is named) | 0.755 (n=323) | **0.768** (n=228) |
| P(TEXT \| none named) | 0.058 (n=362) | **0.063** (n=349) |
| between-coder agreement on the grain judgement | 0.890 | 0.909 |

**The tell: delight in the text has a nameable object small enough to be a discovery** — a word, a tense, a repetition, a position in a sentence. Without one, the delight is in something else 94% of the time.

P9 and P10 were pre-registered as the proportions expected **not** to move, because they are within-span associations post-stratification cannot touch. They did not (z = −0.33, −0.28). **The one place in the study where a null is informative, and it is informative because it was predicted to be null for a stated mechanical reason.**

### The rival surface tell fails twice

P(TEXT | marked) 0.353 vs P(TEXT | unmarked) 0.334; run 1 gave 0.408 vs 0.375. **Exclamation marks, capitals and interjections carry no information about whether the delight is in the text.** The all-caps habit is emphasis, not affection. Prediction P7 registered this as a failure in advance and it failed.

### The substantive finding: the object migrates

Doctrine runs ahead of text, and the gap widens across the sermon.

| | first 10% | final 10% |
|---|---|---|
| run 2, TEXT | .21 | **.10** |
| run 2, DOCTRINE | .43 | **.78** |
| run 1, TEXT | .40 | .26 |
| run 1, DOCTRINE | .25 | .58 |

**He begins enjoying the passage and ends enjoying what the passage supports.** Direction replicates hard in both runs; levels sit lower in run 2 exactly as composition predicts.

### Reliability

**The object code is the most reliable hand judgement in the whole project: κ = 0.908** on 110 matched spans, three disagreements, all DOCTRINE→TEXT. TEXT share between coders +0.934 then +0.946. Working strict-flag 34/34.

**Span count remains the weak link**, moving +0.170 → +0.656 between runs. An agreement statistic that moves half a point between draws is not a stable property of a codebook. **Raw density stays retired.** Working-shown *count* fell below floor (+0.823 → +0.593) while the strict/permissive flag was perfect — the threshold for noticing is unreliable, the judgement once noticed is not.

### Two prior claims corrected

**Borrowed delight is rare: 3.1% and 3.6% of spans.** The borrowed-peak claim from earlier criteria does not extend to exultation.

**The "caught by the text" moment is rarer than run 1 found:** strict working-shown 0.23 → 0.13 per 1k, present in 15 of 44 and 18 of 44 manuscripts.

### The proportions, again

Ten pre-registered, **zero survive Holm**, smallest raw p = .006, MDE ±0.299 single and ±0.389 under Holm. Three moved 11 to 25 points and the family cannot tell any from zero.

**P6, the binarised version of the headline, returns "cannot distinguish" on the exact quantity where the continuous post-stratified analysis gives a clean answer with overlapping CIs.** Rule 0b, demonstrated on the same data in the same report.

---

## The two lenses. Added 27 August, and it corrects an assumption running through this whole document.

**The evaluation standard is what was preached, not what was prepared.**

Every corpus read in this project ran on manuscripts, because that is what the library holds. That was the right research decision and it quietly imported a wrong assumption: that a finding about a document is a finding about a sermon.

**It is not, for a specific set of instruments.** TRD does not measure whether a preacher ended badly. It measures whether he **stopped writing**. A manuscript trailing into `TEACHABLE SPIRIT (13-16)` may have been preached to a fine close from notes. The same applies to L6, unfilled placeholders, the outline test and the spine census: all five read the structure of a document.

### Lens 1: the sermon. Survives transcription.

The three-part application test (object supplied, cost named, objection anticipated). The interior-to-exterior imperative ratio. Christ as grammatical subject of a finite action verb, in prose. The grain tell. Named people and their valence. Reciprocal-object asks. The cross's named object. Non-Christian address and what is asked of him. Whose condition is named. Mode classification for every criterion.

**Everything worth scoring is in this list.**

### Lens 2: the preparation. Manuscript only.

TRD. L6. Unfilled template slots. The outline test. The spine census. Anything reading numbered points, ALL-CAPS labels, or terminal residue.

**These belong to a prep diagnostic, not an evaluation.** The Sketch is already the pre-preaching surface and is where they fit.

### The correction this forces

**The conclusion asymmetry is a finding about manuscripts.** 48 to 10, McNemar p < 0.001, four independent draws, still the most replicated finding here and still true. But it says his *conclusions are written last and often not written at all* — a fact about his Saturday, not his Sunday.

Earlier drafts pointed it at criterion 5's scoring. **That was wrong.** It belongs on the prep card, where "write the last ninety seconds first, in full prose" acts on the thing actually measured.

### Consequence for the norms run

**Detect and store the format per sermon. Compute two sets of norms. Never compare across them.** A transcript cannot fail a structure test, so in a mixed corpus transcript submitters would show near-zero unfinished conclusions and appear to land sermons better. They would not be. They would be unmeasurable on that axis, and the contamination would run into every downstream comparison.

---

## Rubric implications, accumulating

**Nothing here ships until all eleven criteria are read.** Every item is a `prompt_version` claim. A bump invalidates the eleven measured per-criterion standard deviations that the criterion table depends on, and requires double-scoring against the Tier 4 reference set. Shipping these one at a time would spend that cost several times and make any regression impossible to isolate.

Collect, sort, ship one bump, measure once. This section exists so the eventual edit is assembled rather than reconstructed.

**Split into two lists, because they are not the same kind of thing.** Defects are things the product is getting wrong today. Improvements make a working thing better. The count of defects is what should decide how soon the bump gets spent.

---

## A. Defects. The product is getting these wrong now.

### D1. Criterion 1 does not discriminate. Confirmed.

Production scores textual fidelity a **4 on 137 of 172 sermons, an 80% mode.** Two blind, disjoint, pre-registered hand-codings of the same corpus give a 40% and 59% mode with a genuine top (24%, 35% at a 5) and a genuine bottom (7%, 10% at ≤2).

The range is real and the scorer is collapsing it to the middle. This is the strongest rubric finding in the document and the only one confirmed rather than suspected.

**Two consequences.** A pastor handling the text badly is told he is fine; a pastor handling it beautifully gets no credit. And criterion 1's pooled standard deviation of 0.397, the lowest in the rubric, measures the collapse rather than the preacher, so **its gate in the criterion table is wrong and must be recomputed after the bump.**

**The fix is known.** All 28 top-tier manuscripts across both runs contain a **correction move**: the preacher names his own expectation and then surrenders it to the text. If criterion 1's scoring language does not look for that, it is missing the one thing separating a 5 from a 4. Do not mechanize it; a regex catches barely half.

### D2. Does the prompt penalize humor? **CLOSED 2 September. Not present.**

Checked against the production prompt. Criteria 6 and 8 do not penalize humor, jokes or asides; composite band copy never mentions tone or levity. Criterion 6 scores wrestling with textual difficulty. Criterion 8 scores designed emotional rise and fall, with the failure mode being one flat register throughout.

`humor` appears only as a heat-map register colour, and the rewrite register rejects a "knowing joke" **in a suggested rewrite**, not as a scoring rule.

**No action.** The improvement in section B stands: crediting self-aimed humor is still worth adding, but nothing is currently penalising it.

### D3. Does gospel clarity score on features that do not track load-bearingness? **CLOSED 2 September. Not present.**

Criterion 3 is an outcome test, not a surface one:

> Is the good news made unmistakable? Could a non-Christian in the room walk out knowing what the gospel is and why it matters, not just what they're supposed to do better?

Nothing scores gospel by vocabulary density, position, or any textual signature. That is the right construction given four instruments returned r between −0.09 and +0.04 and position is uninformative at +0.038.

**One thing to watch.** `docs/criterion-band-ladders.md` contains draft ladders that do discuss landing and seams. That file is not read by the model today. **It must not be promoted into the prompt without checking it against this finding.**

### D4. Does criterion 7 credit grammatical objects or witnessable ones? **CLOSED 2 September. Neither — and the finding is that the application work was filed under the wrong criterion.**

Criterion 7 does not credit concreteness at all:

> Does this land in the present moment, in this room, with these people — or is it a lecture about ancient Israel that never crosses the bridge into the listener's actual life? … Keller's three-audiences framework (believers, doubters, seekers present simultaneously) is the diagnostic lens.

**Concreteness lives in criterion 9**, and the rubric's own example is a witnessable ask:

> "We all struggle with idolatry" is generic. "If you're the dad who can't stop checking work email at the dinner table, this text is naming what's happening" is specific. Generic application is sermon-shaped wallpaper.

**Consequence, and it reaches back through this document.** Every application finding — object supplied, cost named, objection anticipated, the interior-to-exterior ratio, the six landing modes, the landing-zone work — is about **concreteness**, which is criterion 9. It has been filed under criterion 7 throughout, including by me. See the re-sorted section B.

Criterion 7's own findings are different: the three-audiences question, and the non-Christian address data (present in 17–25% of 443 sermons, median position 88–91% through, **exactly one asks him to take a physical step**).

**No defect. The prompt is not wrong. The filing was.**

**The prep card and the deep dive are unaffected** — they rank measures, not criteria. Only the label attaching a measure to a rubric criterion was wrong.

---

## Only one confirmed defect remains

D1. Criterion 1 does not discriminate. D2, D3 and D4 are closed as not present.

**That changes the urgency of the bump.** One confirmed defect plus a list of improvements is a bump that can wait for all eleven criteria to be folded in. Three confirmed defects would not have been.

## B. Improvements. These wait for the bump.

### From application concreteness (criterion 9, **re-filed 2 September**)

**Add the three-part tell to the narrative.** Object supplied, cost named, objection anticipated. Tells a preacher *why* he received a 3 rather than only that he did. Should inform the narrative without changing the number.

**Define all three by witnessability, not grammar.** See rule 0g and D4. This is not optional phrasing: the grammatical reading returns six times as many hits and credits asks that supply nothing.

**Objection-anticipation is not yet measurable.** Three attempts on the same 17 manuscripts returned 4 (regex), 8 (model, landing zone), and 3 (model, whole manuscript). No hand audit exists. **Hold it out of any scoring until one does**, the way the object marker was validated at 6 against a hand list and then held at 6 across three identical runs.

**Do not treat imperative mood as a proxy for concreteness.** Mark 10 (2017) has fifteen fully concrete applications delivered as questions and four grammatically imperative ones that are practically empty, forty lines apart.

### From gospel clarity (criterion 3)

**The outline test is worth adding as an observable.** Does any numbered main point contain a gospel word? Seven to one on the binary. Requires a manuscript with an outline; absent for transcript-only submissions.

**The named-object construction is an indicator, not a discriminator.** r ≈ 0.24 to 0.30. Mention in a narrative. Never score on it.

**Question 3 mapping.** Non-Christian address appears in 17% to 25% of sermons, median position 88% to 91% through the manuscript, and across 443 sermons exactly one asks a non-believer to take a physical step. The most common move is to describe his danger and give him no verb. Check whether the current question 3 language distinguishes "addressed" from "addressed with something asked."

### From Fallen Condition Focus (criterion 4)

**Ownership is the missing distinction.** Three owners exist: the people in the room, the original audience of the text, and nobody. The expected failure mode, parking the condition with the biblical audience, is rare — two sermons in sixty, twice. **The real failure mode is the ownerless condition, 30% to 42%.** Stable coupling, replicated at 80% and 77%: explicit conditions are hearer-owned, implied conditions usually belong to no one.

**Do not build scoring language on any mechanical FCF signal.** Three of four instrument legs reversed sign between samples.

### From hard things handled (criterion 6)

**Credit self-aimed humor. Do not attempt to flag trivializing humor.** One-directional change; see D2.

**Self-disclosure is not automatically a lowering move.** About a third of it costs the preacher nothing. Scoring language that credits disclosure as such over-credits a third of it.

### From criterion 7, present-tense landing

**Re-filed 2 September.** The application concreteness findings moved to criterion 9. What belongs to criterion 7 is narrower and it is the three-audiences question.

**The non-Christian address data maps here.** Present in 17–25% of 443 sermons, median position 88–91% of the way through the manuscript, and across 443 sermons **exactly one asks a non-believer to take a physical step.** The most common move is to describe his danger and give him no verb.

Keller's three audiences are believers, doubters and seekers. **The corpus says the third is addressed late and asked nothing.** Worth checking whether criterion 7's scoring distinguishes "addressed" from "addressed with something asked."

### From pastoral specificity (criterion 9)

**The two-marker tell is a one-way screen and must be scored as one.** A fact known only by report or observation, plus an ask naming a cost falling on some and not others. Both present is strong positive evidence (18 of 19 across two runs). Both absent means nothing. **Scoring language must not treat their absence as a deduction.**

**Countable and worth surfacing: nobody in the room is ever named in fault.** 0 of 154 across two runs. This is a fact about a preacher's practice that no single evaluation could produce, and it is a genuine pastoral observation rather than a score.

**Do not credit calendared occasions.** Pooled across 93 manuscripts, a baptism, communion Sunday or members' meeting moves this criterion by half a percentage point.

### From emotional arc (criterion 8)

**Criterion 8 is roughly calibrated, and this is a rare clean bill.** Three 5s in 169 scores looked like an unreachable ceiling. Two blind reads with a script-computed ordinal find the corpus genuinely flat: median peak dominance 1.20, one manuscript in sixteen architecturally shaped. **No action.**

**Do not score peak location.** Inter-coder +0.096 on position and 5 of 12 on section. It is not a measurable quantity.

**Do not use earnestness as an inverse signal for movement.** Run 1's tell at ρ = −0.354 came back at +0.058 and is withdrawn.

**The all-caps habit is personal, not generic.** 11.9 per thousand against 0.0 for the one other preacher measured. Any scoring language treating emphasis markers as a genre norm is wrong.

### From Christ-centered arc (criterion 2)

**Agency is the one thing in this criterion worth scoring, and it is fully computable.** Christ as the grammatical subject of a finite action verb: machine r ≈ +0.91 twice, κ = 1.000 across 520 span labels and two panels. Nothing else in the rubric has evidence like this behind it.

**Do not attempt to score built-versus-asserted or condition-answers-rescue.** Both retired at ICC −0.36 and κ −0.07. If criterion 2's language asks the model to judge whether a rescue answers the condition, it is asking for a judgment two trained panels could not agree on.

**Genre moves this criterion hard, and that is a fairness problem, not just calibration.** Gospel narrative runs roughly double wisdom on agency, F = 5.58, p = .0025. **Scoring redemptive movement without accounting for the preached book penalizes a man working through Ecclesiastes for preaching Ecclesiastes.** This is the clearest case in the document for a genre-aware adjustment, and it needs a decision before the bump.

**Countable and worth surfacing.** Christ is the grammatical subject of an action verb in one outline point in two hundred, corpus-wide, census not sample. A preacher does not know this about himself.

### From expository exultation (criterion 11)

**The grain tell is the strongest scoreable signal in the rubric and it is a within-span judgement, so it needs no cohort and no corpus.** Does the exulting sentence name a specific textual object — a word, a tense, a repetition, a position? φ ≈ +0.72 twice, coder agreement 0.90, κ = 0.908 on the object code. **This works on a single sermon.**

**Do not score emphasis markers as exultation.** Exclamation marks, capitals and interjections carry no information about whether the delight is in the text. Failed twice, and was pre-registered to fail.

**The object migration is worth reporting to a preacher and no single evaluation can see it.** Delight begins in the passage and ends in the doctrine: TEXT .21 → .10, DOCTRINE .43 → .78 across the manuscript. Direction replicates in both runs.

**Criterion 11 is measuring at least two separable things.** Affection for the text and affection for the doctrine the text supports are distinguishable at κ = 0.908, and they behave differently across a sermon. If the scoring language treats them as one, it is averaging two quantities that move in opposite directions.

### From ecclesial faithfulness (criterion 10)

**The scoreable test is one question asked of the application block: could a person obey this and never come back?** Run it on the whole manuscript, not the last page. Mutual asks are not reliably last — 2 Cor 8 carries its entire reciprocal ask at 50–70% depth. A "this isn't the main point, but" clause counts as a miss.

**Do not score on the presence of "our church."** phi +0.509 in an open read, **+0.118** on a random draw. It tracks venue, not address. Same for membership density (+0.442 → +0.075) and ordinance density (+0.226 → −0.027).

**A corporate vocative is not corporate address.** The sharpest failure in the corpus: a commentator is quoted arguing an imperative is corporate, the argument is endorsed, and three private disciplines are handed out (Phil 2:12-13, 2017). **If a text addresses a congregation and the sermon renders it privately, that is the scoreable miss** — and it is invisible to any lexical check.

**EFI ≥ 4 is a positive-only signal.** Precision 1.00 in both reads, recall 0.15. Usable to confirm, never to deny.

**Worth surfacing, not scoring:** church language sits in the first or last 12% at roughly twice chance, above chance in 38 of 54 manuscripts. A hearer who arrives late or leaves early hears a materially less ecclesial sermon.

### From structure (criterion 5)

**The conclusion asymmetry is a near-law, and it belongs on the prep card rather than in the scorer.** 48 to 10 pooled, McNemar p < 0.001, four draws. **Corrected 27 August:** it measures whether the preacher stopped writing, not whether he ended badly. See the two lenses above. Criterion 5's scoring should not weight it; the prep card should.

**The controlling image is not evidence of structural quality.** 59% of derived sermons and 54% of imposed ones carry one. Any language crediting a strong governing metaphor as structural conviction is measuring nothing. The 18-year retrospective leans on exactly that.

**TRD and L6 are shippable as observables on the prep lens only**, with rule 12: a hit means look at the ending, not the ending is broken. They cannot tell a collapse from a crescendo, and they cannot run on a transcript at all.

**The Frame-Break Test belongs on the prep card**, not in the scorer.

---

## C. Carried forward, not yet filed

**The absent third party. Framing corrected, twice. ~~It raises the room by giving it someone to be unlike.~~**

Tested in both ecclesial faithfulness reads. Across 96 distinct moves in one and 16 in the other, **pure dismissal is 11% and then 0%.** Warning turned inward plus self-implication is 40% and then 50%. The exemplar runs the full sequence in one paragraph: name three outside religions, level them against the room, put the room inside the category, then put the preacher inside it. The legalist list produced is drawn entirely from his own tribe.

**It is not tribal boundary-drawing. It is a pastoral move that uses an outsider as a mirror.** Nothing goes in the rubric from this. Logged as a hypothesis of mine that inverted on contact with the corpus.

**Costless room-holding.** 254 instances, 22% of the corpus, the largest single cell in the humor table. Domestic asides that name no one and charge no one. Neither a strength nor a flaw as far as anything here shows, but it is the most common thing his wit does and any taxonomy that omits it is incomplete.

**The calendared event finding, narrowed.** Eleven of eleven sermons with a calendared institutional event code as hearer-as-body; zero exceptions in 57. **But it does not generalize.** Tested against pastoral specificity across 93 manuscripts it is flat to half a percentage point.

**Correct statement: a calendared event makes the preacher preach about the church. It does not make the sermon know who is in the room.** The room produces the ecclesiology; it does not produce the pastoral knowledge. No rubric action identified.

---

## The eleven, and what remains

Authoritative list pulled from `sermon_evaluations` on 23 August, not from notes.

| # | Criterion | Status |
|---|---|---|
| 1 | Textual fidelity & exegesis | done |
| 2 | Christ-centered / redemptive arc | done |
| 3 | Gospel clarity | done |
| 4 | Fallen Condition Focus | done |
| 5 | Structure | done |
| 6 | Hard things handled | done |
| 7 | Application to present audience | done |
| 8 | Emotional arc and dynamics | done |
| 9 | Pastoral specificity | done |
| 10 | Ecclesial faithfulness | done |
| 11 | Expository exultation | done |

**Correction, 23 August.** Earlier drafts of this document listed "application to present audience" as still outstanding, distinct from the application landing-zone work. That was wrong. **The application reads are criterion 7.** Treating them as separate would have produced a duplicate read.

### Two cautions for the remaining five

**Criteria 2 and 3 overlap, and the gospel clarity reads already covered part of 2.** Seven routes from text to cross, load-bearing versus removable, and the named-object tell are substantially Christ-centered arc territory. The rubric separates them: criterion 2 is Chapell's redemptive movement, criterion 3 is Bullmore and 9Marks on whether an unbeliever in the room could follow. **The criterion 2 prompt must be framed explicitly against what the gospel clarity reads already found**, or it will return the same seven modes under a different heading.

**Criterion 11 is the likeliest to have no countable layer.** By rule 7, ask first whether expository exultation leaves a physical trace. It probably leaves some (exclamation density, direct address, first-person affect), but the central judgment, whether the preacher is visibly moved by the text itself rather than by his own material, is likely unmechanizable. Go in expecting modes only, and treat a null Tier 1 as a result rather than a failure.

---

## A limitation on all eleven criteria, found 27 August

**Every frame in this project filtered manuscripts to ≥1,200 words. That filter removes a biased subset, not noise.**

Found while validating the norms parser. `Ecclesiastes 4:4-16` ends on two bare ALL-CAPS labels with no prose at all — TRD fires, L6 = 0.17, the lowest in the sample. It is 736 words and the filter drops it. `Acts 20:17-38` is the same shape at 1,176 words and also drops.

**An unfinished manuscript is a short manuscript.** So the filter systematically removes the cases that carry the strongest structural finding in the project.

This does not overturn the 48-to-10 conclusion; it would only have been more lopsided. But **the rate of unfinished conclusions is understated in every study**, and any norms run inherits the same bias.

**Fix for the norms run:** keep the length filter for the corpus statistics, compute the collapse measures on everything, and report the two populations separately.

---

## A caution about the source material

The 18-year retrospective that started this work contains at least one confident false claim: that gospel vocabulary density dropped while the gospel became more structurally load-bearing, read as maturation. Both legs fail, and where both are measured on the same sermons they correlate positively (r = +0.40 core, +0.54 label). Sermons doing structural gospel work have *more* gospel words, not fewer.

**A second claim is now also falsified:** "my weakest exegesis happens under occasion pressure," which failed in both hard-things reads.

Two unrelated numbers with a story told over the top of them. It was caught only because a later read was explicitly asked to test it. **That is the failure mode a productized version will have at scale**, and it is the reason rule 1 and rule 3 exist.
