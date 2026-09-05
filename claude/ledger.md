# The Sermon Coach: working ledger

**This is the one living document. Overwrite it. Do not date it, do not fork it.**

Supersedes `claude/state-of-play.md` and the Status ledger section inside `sermonscore-competitive-analysis.md`. That competitive analysis stays as the research artifact it is; its ledger has been lifted out and merged here.

Last updated 5 September 2026.

**How to use it.** Items move down, never sideways into a second document. When something closes, delete it or move it to Recently closed. When something is imported from a stale source, it goes in Needs status check until someone confirms it against the running product, not against a doc.

---

## Where things live

Canonical sources. Do not duplicate their contents into this ledger; point at them.

| What | Where | Note |
|---|---|---|
| **Criterion band ladders, all eleven criteria, bands 1 through 5** | `docs/criterion-band-ladders.md` **in the repo** | 215 lines. Added at `08b721d`, last touched at `3a73594`. Includes the general ladder, per-criterion bands, five presumptions, the overreach bar, and seven open items. **Canonical on paper, not shipped.** The definitions the model actually reads live in `prompt.ts` and are thinner. |
| **SEO Tier 1: spec, shipped status, and verification evidence** | `claude/spec-tier1-search-visibility.md` | 21 Aug. **Canonical for anything search-related.** Carries the Domain-property sitemap gotcha and three logged corrections. |
| Search visibility and SEO after the .com cutover | `claude/search-visibility-after-cutover.md` | 18 Aug. **Contains a wrong premise** — it claims `sitemap.xml` and `robots.txt` returned 404. They did not. Read the spec doc above instead; keep this one only for the strategy argument in its opening sections. |
| Domain cutover runbook | `claude/domain-cutover-sermoncoach-com.md` | |
| Competitive analysis, sections 1 through 10 | `sermonscore-competitive-analysis.md` | Research artifact, 4 Aug. Its status ledger has been merged into this file and should not be read as current. |
| Melodic line v3.5 reasoning | `claude/melodic-line-v3.5-decision.md` | |
| Recovered branches | `claude/recovered-branches-aug-2026.md` | |
| Growth exclusion and sermon delete spec | `claude/spec-growth-exclusion-and-sermon-delete.md` | |
| 90-day distribution plan | `claude/sermon-coach-distribution-plan-q3-2026.md` | |
| Spanish reviewer brief, Ask 1 filled in | `Sermon-Coach_Brief_v3.md` | Sent 19 Aug. |
| **Corpus derivation** | `claude/claude_corpus-derivation.md` | **Complete 27 Aug, all eleven criteria, 22 reads plus one census.** Canonical for modes, tells, countable metrics, failed instruments, the fifteen binding rules, and **the accumulating rubric list: four defects, twelve improvement clusters.** |
| Report roadmap | `claude/roadmap-report-unlocks.md` | 23 Aug. Layer-based unlock thresholds; supersedes the five-rung ladder. |
| Growth reports inventory | `claude/growth-reports-inventory.md` | 27 Aug. All seventeen proposed reports, what each measures and needs. |
| Deep-dive question set | `claude/spec-deep-dive-questions.md` | 26 Aug. Eleven criteria, the question, the count, the steps, and the already-healthy line. |
| Application deep dive spec | `claude/spec-deep-dive-application.md` | 27 Aug, amended 2 Sept. Built and validated. |
| Corpus norms brief | `claude/brief-corpus-norms.md` | 27 Aug. Parts A and B done; **Part C parked on privacy.** |
| Prep card copy library | `claude/prep-card-copy-library.md` | Fixed text for all twelve measures. Selected by rank, never generated. |
| Two-artifact spec | `claude/spec-quarterly-report-and-card.md` | Why the quarterly report and the card are separate. |
| Prep card spec | `claude/spec-prep-card.md` | Twelve measures, ranking rules, manuscript-only handling. |
| Prep card sample | `claude/prep-card-sample.html` | Hierarchy and print reference. **Its typefaces are wrong** — use the evaluation stack. |
| Parser module | `scripts/sermon_parsers.py` | Validated instruments only. Pure functions, spaCy for I1. |
| **Report roadmap** | `claude/roadmap-report-unlocks.md` | 23 Aug. Every report, its layer, its honest unlock threshold, and its build cost. Supersedes the five-rung ladder. |
| Application measurement spec | `claude/spec-application-measurement.md` | 23 Aug. Tier 1 and Tier 3 for the application deep dive. |
| **Growth module repair spec** | `claude/spec-growth-module-repair.md` | 23 Aug. **Canonical for the Growth rebuild.** Carries the eleven measured per-criterion standard deviations, the gate formula, the verified jsonb paths, and the validity test. |
| Career corpus report spec | `claude/spec-career-corpus-report.md` | 23 Aug. Spec only, nothing built. Eight sections in value order. |
| Pack card unification brief | `claude/brief-pack-card-unification.md` | 23 Aug. Cursor-ready. |

**Filename collision, fix it before it bites.** The `project_content-type_vN` convention produced two unrelated documents both called `Sermon-Coach_Brief_v3.md` — the Spanish reviewer brief above, and the SEO Tier 1 brief that now lives in the project as `claude/spec-tier1-search-visibility.md`. The convention has no project-scoping segment, so any two briefs collide on the second one. Rename by purpose, not by version.

**Also in another Claude thread, not captured anywhere durable:** "OPEN: Calibrating evaluation tiers for API rendering," and a discussion of a one-page sales PDF. Neither is readable from this project. Move anything load-bearing out of chat threads and into the repo or this project.

---

## Open now

### Coach Pro and the Growth module

**Direction set 23 August 2026. Pro does not exist yet. The gate does.**

**The structure.** Coach is sermons and sketches at ten evaluations a month. **Pro is identical on sermons, sketches, and cap, and adds the Growth module.** No cap increase, at either tier.

The module opens with the growth chart, now gated, **which is being rebuilt before Pro launches.** The report ladder unlocks on top of that chart.

**Why this holds, stated carefully because an earlier version of this entry got it wrong.** The objection to a Pro tier was never fairness; the grandfather settled that. It was that a subscriber would pay extra on day one for reports arriving months later. He does not. He gets the chart the week he upgrades, and the ladder is what keeps him in month six and month eighteen. **The chart carries the price, the ladder carries the retention.**

**Which makes the chart load-bearing.** It is the entire day-one justification for the tier. If it ships as the chart that existed on 22 August, Pro is a promise again.

**The value story, which is the positioning expressed as a price:** Coach evaluates sermons. Pro tracks a preacher.

**The route gate shipped 23 August and needs no rework.** Whole route, not per-feature, because Coach gets no Growth at all.

**Open: the price.** Likely $49, but decide it after the rebuilt chart exists and can be looked at. Deciding the price first and building to justify it is how you end up defending a number.

**Also open, and it is a commercial fact rather than a design detail.** The criterion table needs eight sermons before its two cohorts are disjoint, and sixteen before it is sharp. At realistic submission rates a new Pro subscriber sees the chart and nothing else for two to three months. That argues for a backfill motion at signup, bringing a year of old manuscripts in to reach a usable sample in weeks. Decide whether that motion exists before pricing the tier.

### Read a prep card. The next thing that matters.

**The card has never been read by anyone.** Everything built on 2–5 September rests on whether five measures with a transcript split produces something a preacher would use, and nobody knows.

Requires applying `supabase/migrations/20260905190000_prep_cards.sql` **by hand** in the SQL editor, then `supabase migration repair`. Never `db push`; history is out of sync from `20260727180000`.

**Read it against one question:** does this tell me something I did not know, and would I do anything differently next Saturday? The deep dive got materially better three times because Chris read the output and said what was missing.

### Series Prep in Stripe. One decision, outside the repo.

`/checkout?pack=pack_12` still resolves to a live $109 price, and the Payment Link `3cI14gcWm2dUa0I6ZL04806` may still be active in Stripe even though it is gone from the site. **Nobody holds unused Series Prep credits.**

Either it stays honourable for anyone with an old link, or it is genuinely gone. **If you archive the price, `pack_12` comes out of `checkout.ts` in the same pass** rather than routing to a dead price.

### Sermon purge job. First rows mid-September.

Merged 5 Sept behind the report-only flag. First soft-deleted rows become eligible mid-month. **Report-only is mandatory for the first cycle.** Check the output before the flag comes off.

### The rubric bump. One confirmed defect, three checked and closed.

**Nothing ships one at a time.** A `prompt_version` bump invalidates the eleven measured per-criterion standard deviations the criterion table depends on and requires double-scoring against the Tier 4 reference set. Collect, sort, ship once, measure once. Full list in `claude/claude_corpus-derivation.md` sections A and B.

**D1, confirmed. Criterion 1 does not discriminate.** Production gives textual fidelity a 4 on 137 of 172 sermons, an 80% mode. Two blind pre-registered hand-codings of the same corpus find a 40–59% mode with a real top and bottom. **Its standard deviation of 0.397, the lowest in the rubric, measures the collapse rather than the preacher, so its gate in the criterion table is wrong and must be recomputed after the bump.** The fix is known: all 28 top-tier manuscripts contain a correction move, where the preacher names his own expectation and then surrenders it to the text.

**D2, D3 and D4 are closed. 2 September, checked against the production prompt.**

**D2, humor: not present.** Criteria 6 and 8 do not penalize humor, jokes or asides. Band copy never mentions tone. Criterion 6 scores wrestling with textual difficulty; criterion 8 scores designed emotional rise and fall.

**D3, gospel clarity: not present.** Criterion 3 is an outcome test — could a non-Christian walk out knowing what the gospel is — with no vocabulary, position or surface signature. **Watch item:** the draft ladders in `docs/criterion-band-ladders.md` do discuss landing and seams, are not read by the model today, and must not be promoted without checking against the finding that load-bearingness has no surface signature.

**D4: not a defect, but the application work was filed under the wrong criterion.** Criterion 7 does not credit concreteness at all; it scores present-tense landing and Keller's three audiences. **Concreteness is criterion 9**, and the rubric's own example is a witnessable ask — the dad who cannot stop checking work email at the dinner table. Every application finding in the derivation document has been re-filed from 7 to 9. **The prep card and the deep dive are unaffected: they rank measures, not criteria.**

**One confirmed defect remains, D1.** That is a bump that can wait for all eleven criteria to be folded in. Three would not have been.

### The prep card is the product. Reframed 2 September.

**Chris's reversal, and it is right.** The reports were built first and the prep card treated as a byproduct. If the artifact that changes a Saturday is the card, the card sets the requirements and the reports serve it.

**Seven disciplines survive the "can he act on it Saturday" filter:** the correction move, the three-part application test, write the conclusion first, the Frame-Break Test, Christ as subject of a main point, the reverence check, and the obey-and-never-return test.

**The card names his three weakest.** Six of the seven are countable; the reverence check is a self-administered question and rides unconditionally. **Ranking seven disciplines is a much smaller measurement problem than measuring eleven criteria** — no gate, no cohort, no norm, just an order, and the top three only have to be roughly right.

**Consequence: norms matter less than assumed**, because ranking a man against himself needs no distribution. That unblocks a lot, since Part C is parked anyway.

**Open:** rank absolute or against norms (leaning absolute, framed as "your own numbers sit lowest here"), and re-ranking cadence.

### Privacy blocks the norms run

**Found by Cursor in Step 0, 2 September, and the reading is correct.**

Privacy policy §2 says sermon content is not analyzed "beyond what is required to generate your evaluation." Terms §6 licenses processing "solely for the purpose of providing the Service to you," and the license ends on delete. **Corpus-wide norms are not a service provided to that preacher.**

Not a gray area to proceed through. Two paths: amend the terms with notice to existing users, or build norms from Chris's own sermons and label them as one preacher's baseline. **Fold into whatever review eventually covers the GTN partner code system and the coverage clause** rather than spending attorney money on it alone.

### The quarterly criterion deep dive

**The recurring engine for Pro. Decided 23 August 2026.**

One criterion at a time, read deeply across a preacher's corpus. Not a score and not a trend: modes, default, break-points, and a tell he can run on his own manuscript before preaching. Eleven criteria at one per quarter is nearly three years of payouts, and it does not deplete the way a ladder does.

**He picks, it is not doled out.** At the threshold Pro says there is now enough here for a deep read on any one criterion, which do you want first. Same cadence, same eleven reports, but he directs his own development rather than collecting rewards. This keeps the standing rule intact: unlocks are framed as "there is now enough data to say this," never as "you have earned this."

**It threads.** Each dive names the specific thing to work on; the next dive on that criterion opens by saying whether it moved. That turns a rotation into a curriculum.

**Honest minimum is about 20 sermons, not 50.** A deep read is synthesis over text, not a statistical comparison, so it does not need power. Twenty criterion narratives plus twenty manuscripts is enough.

**Cost.** Roughly $1 to $2 per report on manuscripts plus narratives, four times a year. Six dollars per subscriber per year against $588 in revenue. **This is the first artifact whose marginal cost scales with corpus size**, so cap the read at a sample (most recent 30 plus a stratified handful) and say so in the report.

**Application is first**, because the 18-year retrospective already describes his application patterns and therefore provides an answer key.

### The assessment / coaching split

**The dilemma, named 23 August.** A subscription is a claim that value recurs. Retrospective analysis answers a question once and cannot answer it again. Build the corpus reports well and a subscriber consumes them faster; ration them and the product stops being honest. Both horns are real.

**The resolution: they are two goods.**

**Assessment** is a purchase. The corpus report, the coverage map, the archetype. Who am I as a preacher, what do I keep doing, what have I never touched. High value, delivered once. Priced above the Intensive. Natural buyer at a natural moment: a preacher with a folder and fifteen years, at a milestone.

**Coaching** is the subscription. The quarterly deep dive, the personalized prep card, the named focus, a Sketch that knows his tendencies. All about the sermon he has not preached yet, so it recurs by construction.

**And the assessment sells the subscription.** A preacher who learns his conclusions fizzle and his climaxes are borrowed is not finished; he is newly aware of three things to fix. Better conversion than a free evaluation, because he arrives already convinced there is work to do.

**Chris's amendment, and it is right:** the Growth module itself is not purely retrospective. A coverage map has a goal state, and the criterion table's recent cohort fully turns over in under three months at three sermons a month. Those genuinely say something different each quarter. The test that sorts any candidate feature: **will this say something different in ninety days?**

**Consequence for sequencing.** The recurring half is what does not exist yet. The prep card and the named focus sit near the bottom of the roadmap and belong near the top. Do not price Pro until they exist.

**Churn is currently unmeasurable**, so neither position on "does Growth hold a subscriber past month six" can be settled from data. Add a cancellation timestamp and reason before Pro launches, or the question stays a matter of opinion for another year.

### The report ladder

**Framed as "there is now enough data to say this," never as "you have earned this."** The schedule is set by what the sample can carry, and where retention and honesty disagree, honesty wins. The moment a preacher senses something is being withheld that could already be told, the product stops being coaching and becomes a loyalty program.

Because the reason is honesty, **the ladder should be published rather than hidden.**

| At | Unlocks |
|---|---|
| 10 | Most consistent strength, most persistent weak criterion. A tendency, not a trend. |
| 25 | Trajectory, plus what the best sermons share. |
| 50 | Genre analysis: narrative, epistle, poetry, prophecy. |
| 100 | Dated inflection points, and what was lost while other things rose. |
| 200 | Criterion correlations, and plateaus. |

**Superseded in part, 23 August evening.** The five-rung ladder is ordered by how impressive each finding sounds rather than by what it costs in sample, and past rung 25 the two diverge badly. See `claude/roadmap-report-unlocks.md` for the replacement, which unlocks by **layer within a criterion** rather than by criterion: per-sermon markers at n=1, distribution as counts at ~15 to 20, level against corpus norms at ~10, his own change over time at ~40, split by condition when the corpus allows. The same criterion then appears at four different rungs, which is a better ladder than five arbitrary thresholds because it does not deplete.

**The thresholds count sermons, not evaluations.** Settled 23 August alongside one-point-per-sermon. Every published number needs restating in sermons before it goes on a marketing page.

**The upper rungs are horizon, not retention.** At six evaluations a month, the heaviest observed real rate, rung 100 is seventeen months out and rung 200 is three years. At three a month, 200 never arrives. Publishing them says the product has a horizon. They cannot be asked to hold anyone.

**The thresholds are estimates made in conversation.** Validate against the 700-sermon corpus by subsampling at 10, 25, and 50 and seeing where each finding stabilizes, before publishing any of them.

### The grandfather

Fourteen accounts hold permanent Growth access. **The gate and the grandfather shipped together on 23 August, so no account ever lost a feature it had.** Pack buyers were included in the one-time backfill because they paid under the old promise. Do not extend that to anyone new.

### Growth module repair

**The branch that has to land before Pro can be priced. Spec is complete at `claude/spec-growth-module-repair.md` and nothing in it is waiting on analysis.**

What the live page does wrong today, verified by screenshot 23 August: plots one point per evaluation so a thrice-run sermon reads as three weeks of preaching; lets the line fall through the plot area on failed evaluations; shows four "Rubric updated" markers where only one boundary moved the mean; reports a two-sermon comparison as eleven criterion deltas, all inside the noise floor, with no interval.

The criterion table component itself is good and stays. It gets repointed from sermon-versus-sermon to cohort-versus-cohort, with the cohort growing as the corpus grows. The two-sermon diff moves to the sermon page, where two columns can honestly compare drafts of one sermon.

**One known edge, logged and not fixed in this branch.** `excluded_from_growth` lives on `sermons` (`user_id`) while evaluations carry `owner_id`. A mentor evaluating a mentee's sermon cannot exclude it from his own growth line. Small now, real once Develop Others has volume.

### Criterion 8 is writing two different names, and it blocks the criterion table

Measured 23 August across the corpus: id 8 returns "Emotional arc and dynamics" on 169 scores and "Heat Map: emotional delivery" on 3. Anything grouping by `criterion_name` splits criterion 8 into a phantom twelfth row, which includes every per-criterion trend in the rebuilt module.

Fifteen minutes. Add the alias in `normalizeLegacyCriterionNames()` and backfill the three rows in the same commit, per the standing rename discipline. **Do this before the repair branch.**

### Rubric calibration, measured rather than suspected

From the 23 August distribution query, latest evaluation per sermon, 172 sermons:

- **Christ-centered / redemptive arc awards a 5 in 48 percent of all scores** (83 of 172), the highest mean in the rubric at 4.27. Fives are not rare on the criterion that carries the positioning.
- **Textual fidelity returns a 4 on 80 percent of all scores** (137 of 172). A criterion that says the same number four times out of five is carrying almost no information.
- Emotional arc has awarded 3 fives in 169 scores. That is a two-order-of-magnitude spread in what a 5 means across the rubric.

**This belongs in the 4.1 consolidated edit**, not as a new workstream. It is the 4-versus-5 ceiling problem already logged, now with numbers.

**Two rules from the corpus derivation work now bind every metric in the product.** Full record in `claude/claude_corpus-derivation.md`.

1. **Control for the book before claiming drift.** Book explains 20.7% of gospel vocabulary density variance; year explains 5.3%. After subtracting each book's own mean the year effect is r = −0.023. A naive report would tell a pastor his gospel clarity collapsed in 2020 when he preached 1 Timothy. Replicated independently. Assume the confound exists for every metric until checked.
2. **No tell ships from a single corpus read.** The gospel clarity first pass produced an elegant, mechanically detectable tell that the replication reversed. One read produces plausible instruments; only a disjoint second read says which are real.

**It also constrains a Pro artifact.** The per-criterion standard deviations cannot be reported to a pastor as facts about him in absolute terms, because textual fidelity's low variance is the criterion failing to discriminate rather than his exegesis being steady. **Any stability or volatility artifact must be corpus-relative:** his spread on a criterion against the corpus spread on that same criterion. "You swing more than most preachers do on application" is supportable. "Your exegesis is your steadiest discipline" is not.

**The grader-noise experiment is parked and no longer needed.** The distribution query answered what sixteen repeat runs would have answered. Note for the record: the three-run Opus v3.5 variance test that produced 50, 50, 53 and the 0.55 noise floor **has no rows in `sermon_evaluations`.** That floor is quoted in several places and its evidence is not queryable.

### Copy defects live on paid or near-paid surfaces

- **Six em-dashes on `public/pricing.html`**, three in FAQ answers, one in the Coach feature list. Against the standing rule, on the highest-intent public page.
- **An em-dash in the Growth criterion-table subhead**, plus a subhead that describes two states and renders three, and a delta column mixing "Held" with "-1".
- **Sidebar reads "Growth FREE"** while the route is gated.
- **"To reach a 5, ..." appears inside criterion narratives in production.** This is the growth-edge score framing already decided against and not yet actioned. It is live in front of pastors now.

### Sermon delete purge job

Daily hard delete after 30 days, archiving to `_admin_row_archive` first and logging what it purged. The window opened at the #247 merge, so the first rows become eligible **18 September 2026**. Nothing is built.

### The overreach number is suspect, and it gates the biggest build on the board

Open item 7 from the band ladders file. The shadow run reported 2 to 6 overreach flags per sermon, median 4, across 17 sermons. That figure is load-bearing for the passage-first pass in 5.1a. But therapon was one of those flags and it was a false positive.

Hand-audit three or four sermons and sort every flag into real overreach, defensible reading wrongly flagged, or genuinely contested. If the false-positive rate is high, the finding that justifies the whole passage-first pass is inflated and the build is bigger than the problem. **This gates 4.1 and it is Chris's own judgment, not a build.**

### Preview deployments are public

Vercel Authentication is off. If turned on, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` can be blanked on Preview only. A second Turnstile widget does not work: the secret is one project-wide Supabase Auth setting.

**Not an SEO problem.** Vercel sets `X-Robots-Tag: noindex` on preview deployments automatically, so previews were never indexable. Only the production `.vercel.app` alias was, and that is now closed. This item is about public *access*, not crawling.

### Sample pages are stale, and now they are in the sitemap

Two of the three public samples are Exemplary and one is Strong, so the shop window skews top-tier, and none of them reflect any prompt improvement since they were hand-built. They stayed in the sitemap during Tier 1 because dropping already-public URLs would have shrunk a working map, and excluding them from a sitemap would not deindex them anyway.

That decision is defensible but it raises the stakes on 9.2 below: Google is now being pointed at the least representative artifacts the product has. **This is a distribution dependency, not a nicety** — it is what a pastor clicks after an outreach email lands.

---

## Sales one-pager

**Stub. Details live in a Claude thread this project cannot read.**

Intent: pull "what's strong" and possibly other report sections into a single short PDF, ideally one page, that Chris alone uses to run sales conversations. Not a customer-facing product surface.

Four questions to settle before this can be written as a real spec:

- Who receives it, a prospect pastor or an institution
- Generated from a real evaluation, or hand-built once as a template
- One page per sermon, or one page showing what the product does
- A leave-behind after a conversation, or the thing that starts one

Related and worth deciding together: two of the three existing public samples are Exemplary and one is Strong, so the public set skews top-tier. A sales page built from a top-band sermon sells the ceiling rather than the coaching.

---

## Evaluation quality

**Sonnet coaches better than Opus, and nothing has been decided.** On identical v3.5 runs Opus gave 15/15 on Text and Theology three times and found nothing to fix. Sonnet named a real gap and asked a question the preacher could act on. A grader that cannot withhold a 5 has nothing to say next month. Unresolved whether that is a model property or a band-ladder problem. Most consequential open question in the product.

**`getEvaluationModel()` should throw, not fall back.** `EVALUATION_MODEL` was never set in Vercel, so the `claude-opus-4-8` fallback has silently chosen the grader since 7 June across 160 of 173 scored evaluations.

**Set temperature explicitly on the scoring pass and re-measure.** Currently unset, so the API default of 1.0 applies. Do not reflexively set 0; the same call writes the coaching prose. Noise floor at 1.0 is about 3 points on /55, roughly 0.55 on display, so Growth Report movement under 0.6 is noise.

**Floor guard, and pull the 11/55 row.** A failed evaluation can render as a real score. One came back 11/55 where the observed floor across the corpus is 28. It was Chris's own account so no customer saw it, but it should be excluded before it lands in any corpus statistic.

**Passage inventory, remaining 46 diffs (Track 0.2).** Shadow-mode run crashed at row 18 on a JSON parse error. See the overreach audit above; the conclusion this run produced is the thing now in question.

**Cold reference set (Track 0.1) is background, not a gate.** Downgraded 12 August. Chris hand-scoring five or six sermons. Useful, not blocking.

---

## The consolidated prompt edit (4.1)

One edit, not four. Ships all at once.

**Contents, as of 12 August:**

- The eleven band ladders from `docs/criterion-band-ladders.md`, replacing the thinner definitions currently in `prompt.ts`
- The five presumptions, stated inline inside band definitions, never as a separate pre-scoring pass
- One nullable boolean per criterion row recording a presumption override. No reason string in the schema; override reasoning lives in the narrative the pastor already reads
- The passage-first pass from 5.1a
- The three changes already held: criterion 7 grace-motivation cap, criterion 4 functional-centrality cap, emotional-arc Piper reframe

**Cut on 12 August: the symmetric inflation check.** The 8.2 finding that the scale had no floor was retired when the first mid-band submission from a stranger returned 31/55 on v3.4 with three 2s, four 3s, four 4s and no 5s. The scale has a floor; it had not been shown one.

**Gated on:** the passage-first pass, and the overreach false-positive audit above. Not on the cold reference set.

**Acceptance test, written before the experiment.** `composite_simple` and `composite_weighted` are currently identical on 54.5% of evaluations and within one point on 98%. If 4.1 restores 3 as a working anchor, divergence should rise. If the distribution looks the same afterward, the edit did not do what it claims regardless of where the mean moved.

**Follows 4.1, never precedes it:** publishing band definitions to pastors (4.3, 5.5, 5.17). Publishing thresholds makes every score auditable. Known edge case to disclose: band thresholds run on the internal /55 while display runs on /10, so one criterion moving one point took the Hebrews 3 composite from 8.5 Exemplary to 8.4 Strong. A pastor comparing two of his own reports will find that eventually.

**Also still open:** growth-edge framing (4.2 / 5.15), moving score movement out of the prose into the disclosure layer, and the attribution pass (4.4) now covering the wait screen.

---

## Decisions the band ladders force

Make these before 4.3 publishes anything.

- **Criterion 8, emotional arc, has no source** and currently prints an internal `Sermon-coach` slug where a name belongs. Attribute to Piper under proportionality, or state plainly that it is unattributed. It cannot keep printing a slug on the surface where provenance is the whole argument.
- **Criterion 9, pastoral specificity, has no source anywhere in the ledger.** Left unattributed rather than invented, correctly. Attach one that survives the provenance standard or say so publicly.
- **FCF is filed under Category 2, Structure & Craft.** It is a textual and theological move and one of the three double-weighted criteria. A pastor reading category averages sees it counted as craft. Deliberate taxonomy choice, not an accident to discover after publishing.
- **Criterion id 8 carries a legacy alias**, `Heat Map: emotional delivery`, 4 rows, v3.1 only. Any rename must ship a `normalizeLegacyCriterionNames()` entry in the same commit. Strict on write, alias on read.

---

## Spanish

**Ask 1 sent 19 August. One reviewer, in Spain. Two-week deadline, so roughly 2 September.** Discount conversation was kept separate, correctly.

**Exit criteria still unwritten, and the window is closing.** Write them before the first reply lands, or they become rationalization with a timestamp. Three lines, private: what makes this a build, what makes it a no, and the most likely reason it ends in a no.

**One reviewer is an opinion, not a review**, and it is the opinion of a field partner on a permanent discount who wants this to work. Spain and Latin America were always expected to disagree. Two more reviewers, same brief, same two-week clock from their own send date, is the minimum where a disagreement means something. Contacts already exist.

**Open Ezequiel's report.** `ezequiel.caetano@uol.com.br` scored 28, the lowest customer score in the corpus. Read before designing any wider pilot.

**Field-partner discount rule is unwritten.** Working definition: 50% off Coach for the life of the subscription, subscriptions only, never packs or Intensive.

---

## Needs status check

**Imported from the SermonScore ledger, last updated around 6 August. Nothing here has been verified against the running product since.** Confirm each against production or the repo, not against a document. Items that turn out to be shipped get deleted, not moved.

| Item | What it was | Why it needs checking |
|---|---|---|
| **2.1** Verdict lines backfill | 29 pre-fix rows, run with `--force` or they keep overlong lines permanently | The source ledger says verdict lines merged 5 Aug at `2951b58` and *also* lists them as the next thing to build. The doc contradicts itself. |
| **1.3a** `.com` Workspace domain alias | Installs MX, routes chris@sermoncoach.com to the same inbox, free | More urgent now: `.com` is the canonical web domain as well as the live From domain, and still has no MX. Also check `List-Unsubscribe` and the marketing/transactional split in Resend Logs. **Partly unblocked:** the `.com` zone already carries an SPF record, so Phase 7 is further along than the runbook assumes. Still needs DKIM and DMARC. Still its own morning. |
| **2.2** Wait-state carousel (5.9) | Nine slides written, needs the four category names for the stage line | Unknown whether it shipped. |
| **2.3** Score display cleanup (5.4) | Cut Tier 5, the formula line, "Simple composite," the category-header sums. Protect the methodology sums. | Highest over-delete risk on the list; name the protected numbers in any brief. |
| **2.4** Small copy fixes | 100 wpm with pace named, circled plus on Mentoring, sample review link in submission flow, tab-aware subhead, em-dash in Where You Can Grow | Several may have shipped in the July and August passes. |
| **5.16** Quote audit | `cursor-brief-quote-audit.md` written, not started. Verify existing quotes against the manuscript before pushing fill rate up. | Fill rate measured at 22%. Fabrication is the failure mode; measure before increasing volume. |
| **3.1** Mentor seats, remainder | Stripe prices and env vars, runtime verification of seat checkout, relationship termination on cancel | Entitlement and caps applied to production 6 Aug. The billing half was never confirmed. |
| **3.3** Mentoring sample artifact (5.8a) | Mentor view and mentee view of the same submission, mid-band sermon, fictional mentee | Blocks the circled-plus affordance. An icon that leads to a page a pastor cannot buy from is worse than no icon. |
| `.tmp-verify/` in `.gitignore` | That folder held live auth session tokens | `.gitignore` gained three lines in the #247 merge. Probably closed. Verify. |

---

## Compounding assets, not yet started

- **Congregational profile as a durable object (9.3A).** Cheapest high-leverage item in the analysis. Converts the one structural advantage from a weekly opt-in into something that compounds. Also the criterion 9 fix: pastoral specificity is the criterion this most improves and the one a competitor structurally cannot score, because he never asks.
- **One sample page rendered from a stored evaluation (9.2).** The only structural fix for a shop window that goes stale on its own. Matters more the moment 4.1 lands — and more again now that the stale samples are in a submitted sitemap Google has read.
- **`/sketch` is the best organic asset you own and it is still underused.** Free, six questions, no account, no card. In this niche a genuinely free tool is the only page type that earns unprompted links and gets named when a pastor asks an AI assistant how to check an outline. **The two cheap things are done** — it is in the sitemap, crawlable, and has its own OG card. The build-on-it work stays parked until the conversion question is answered.
- **Second cadence beat (5.6).** The Sketch beat midweek alongside the Monday nudge. Warming state needs rechecking before adding a second send.
- **The Arc (9.3C).** Series-level read, unlocked at four evaluated sermons in one series. **Moved behind Pro on 23 August** along with every macro report, per the Growth reversal.

**Distribution is still the finding nobody has acted on.** Twenty-five items in the competitive analysis, all product and copy, none of which put the product in front of more pastors. See `claude/sermon-coach-distribution-plan-q3-2026.md`. The constraint is not the report.

---

## Repo hygiene

**Four recovered branches await merge-or-archive.** `recover/evaluation-ui` cannot build standalone because it imports `output-language`, which only existed on the feat branch that has since merged. Detail in `claude/recovered-branches-aug-2026.md`.

**`recover/live-function-migrations` can probably be archived.** It carried `complete_mentored_evaluation.sql` and `credit_functions_service_role_guard.sql`. Both are now confirmed live and ledgered.

---

## Decided, do not relitigate

| Decision | Call |
|---|---|
| Melodic line | Descriptive, not scored. Belongs to the book, named as context in criterion 1's narrative and the display block. Must not move criterion 1's band. `claude/melodic-line-v3.5-decision.md`. |
| Big idea | Robinson, criterion 5, passage-level. Distinct from the melodic line. |
| Presumptions | Stated inline inside band definitions, never a separate pre-scoring pass. A pre-score question on eleven criteria costs roughly 2,000 output tokens per evaluation to buy behavior available from wording. |
| Presumption overrides | One nullable boolean per criterion row. No reason string in the schema. Override rate stays queryable; reasoning lives in the narrative. |
| 3 as the anchor | 3 is present, competent, and unremarkable, and should be the modal score for a faithful weekly sermon. Not reserved for weak sermons. |
| Overreach bar | Deliberately high. A defensible mainstream reading is not overreach. Incidental overstatement presumes 4; load-bearing presumes 3. |
| Audio ingestion | Deferred. Revisit if a test-round pastor cannot submit. |
| "Tier 5" band suffix | Cut from display, keep any internal index. |
| Mentoring nav affordance | Circled plus, not text. |
| Sermon length divisor | 100 words per minute, pace named in the copy. |
| Growth-edge score framing | Move the number out of the prose into the disclosure layer. Decided, not yet actioned. |
| Growth inside Coach | **Reversed 23 August 2026.** Growth now anchors a paid Pro tier, along with every macro report built from here. The reversal is a packaging change, not a takeaway: fourteen accounts are grandfathered permanently and the gate and the grandfather shipped together. |
| Growth access after 23 Aug 2026 | Comes from Pro and nothing else. Pack buyers were in the one-time backfill because they paid under the old promise. Do not extend that to anyone new. |
| One point per sermon | The growth trajectory takes the latest run of each sermon. Four evaluations of one sermon is one sermon in a body of work. Draft history lives on the sermon row, and the two-column diff moves there with it. |
| Ladder counting unit | Sermons, not evaluations. |
| Stability and volatility artifacts | Corpus-relative only, never absolute. A criterion's low within-preacher variance may be the criterion failing to discriminate rather than the preacher holding steady. |
| The witnessability test | **One rule, three instruments.** Interior vs exterior imperatives, object supplied, and cost named all reduce to: could someone other than the hearer tell it happened? Frozen 26 Aug. Implementing `named_object` as a grammatical test returned 38 of 57 asks; as witnessability, **6**, matching a hand audit exactly and holding across three identical runs. |
| Deep-dive denominators | **Sermons, not asks.** The model-returned ask count moved 49–55 across three identical runs; the sermon count did not. Print "3 of your 17 sermons," never "6 of 49." |
| A marker ships only after a hand audit | The object marker was validated at 6 against Chris's own list, then held at 6 three times. **Objection-anticipation returned 4, 8 and 3 across three attempts with no hand audit and is stored, not printed.** |
| Mode classification | Stored, never printed as a count. Re-ascent moved 14 → 11 and confessional 1 → 0 between runs on the same 17 manuscripts. Report as dominant-pattern prose. |
| Community benchmark | Never build it. Ranking a pastor against other pastors is the thing the brand exists not to do. |
| Unlimited evaluations | Never match it. Argue the cap on coaching grounds. |
| Proprietary framework naming | Never. Provenance is the one advantage a competitor cannot copy without becoming us. |
| Peer read model for church teams | Never build it. Pastors are private about sermons in a way students are not. |
| SEO posture | Hygiene only, and the hygiene is now done. No keyword targeting. The SERP for "sermon evaluation" is wall-to-wall free templates, so that intent is "give me a printable sheet," not "I will pay $29 a month." |
| `/start` crawlability | Keep it crawlable. Excluded from the sitemap, never disallowed in robots. It is the CTA in every post and every outreach email; a blocked CTA accrues no link equity and cannot be cited. |
| `.online` registration | Keep it registered and redirecting permanently. Every sent email points there, it is still the sending domain, and the Change of Address window runs to roughly 17 Feb 2027. |

---

## Parked, with triggers

- **Preaching Team bundle (5.20).** Build when a church asks for it. The packaging math is ready.
- **Audio ingestion.** Revisit if a test-round pastor cannot get a sermon in.
- **Sketch public no-auth build.** After the test round clears quality and conversion.
- **Passage read (9.3B).** After the passage-inventory work, since it is mostly the same component.
- **Archive read and tendency profiles (9.3E).** After the Intensive boundary is drawn on the pricing page.
- **Per-post OG images.** Deferred on purpose. `next/og` `ImageResponse` needs the font as an `ArrayBuffer` at the edge, and Charter is not fetchable from Google Fonts. Half a day for a marginal gain over the static card now shipped. Revisit only if blog sharing becomes a real channel.
- **`http://sermoncoach.com/index.php`** appears as a referring page in Search Console. There is no PHP anywhere in this stack, so it is almost certainly a spam link at a URL that never existed. Confirm it 404s or redirects cleanly at some point. Blocks nothing.
- **Classroom stale-Cohort sweep, GTN partner codes, blog automation, sermonrefinery.com renewal.**

---

## Recently closed

**SEO Tier 1 is closed.** 21 Aug. Full record and verification evidence in `claude/spec-tier1-search-visibility.md`. Do not start an SEO program on top of it; this was the floor, not a channel.

- **The indexable Vercel alias is dead.** `sermon-coach-site.vercel.app` now returns `HTTP/2 308 → https://sermoncoach.com/`. It had been the top organic result for the brand query. Verified by curl, not by dashboard.
- **App Router `sitemap.ts` and `robots.ts` shipped**, replacing hand-maintained static files that would have rotted the first Friday a post shipped without a manual edit. Branch `feat/seo-tier1`, commit `7b74c2e`, 27 files. `public/sitemap.xml` and `public/robots.txt` deleted in the same commit — mandatory, because a surviving file in `public/` silently shadows the route with no build warning.
- **Canonicals site-wide**, and nav/footer home links moved off `/index.html`.
- **OG and Twitter cards on `/sketch` and every blog post, plus `Article` JSON-LD.** Two 1200×630 cards built in the locked palette, set in Charter. This closes the "blog post metadata" row that was sitting in Needs status check.
- **Search Console done.** Both domains verified as Domain properties via DNS TXT. Change of Address filed `sermoncoach.online → sermoncoach.com`, started 21 Aug, 180-day window to roughly 17 Feb 2027. Sitemap submitted and read Success, 17 pages. Indexing requested on four URLs.
- **Production verification, all three fingerprints matched.** Both old and new files return 200, so status alone proved nothing; the greps were chosen to distinguish the two. `sitemap` contains `/start`: 0. `robots` contains `auth`: 1. Home contains `index.html`: 0. Google's own live URL Inspection then returned "Page can be indexed" against a 19 Aug crawl that had said "Duplicate without user-selected canonical."
- **Bing Webmaster Tools added and sitemap submitted.** Verified by CNAME in the GoDaddy zone. Presence play only: Bing's own traffic is negligible, but its index feeds ChatGPT's search layer and Copilot, and pastors increasingly ask an assistant rather than a search box. **The dashboard will show zeros indefinitely. That is the expected outcome, not a failure.** Done once, not a channel to monitor.

**Prep card built and merged.** 5 Sept, `feat/prep-card` at `d8cf651`. Five actionable measures (2, 3, 4, 5, 7) plus strengths-only 9 and 12. Ranking, copy module, surface at `/dashboard/prep-card`, storage. Type stack matches the evaluation page: serif display and body, system sans for labels. **Migration `20260905190000_prep_cards.sql` is in the tree and unapplied.** Nothing user-facing until it is.

Real counts on 12 production sermons: named object 6/12, named cost **0/12**, TRD finish 2/6 manuscripts, frame-break 2/6, reciprocal 3/12. Cost-naming at zero is a real coding result, not an empty call — 31 asks found across the 12, every one carrying an explicit boolean, and it matches the validation corpus at 1 of 17.

**Series Prep retired.** 5 Sept, PR #331, merged as `61cb29f`. Pack card and size toggle removed from `pricing.html` in favour of four lines of prose under Coach; `BuyPackCards` drops to two options with Best Pack Value moving to pack_6; `DashboardSubscribeCTA` row removed. Dead `.pack.featured` and `.pack-best-value` CSS removed; the `.pack-size-*` classes the mentoring seat toggle depends on left untouched. **Retirement is UI-only and deliberate:** `pack_12` remains a valid SKU end to end so existing credits keep working. Verified live: Series Prep, the payment-link comment and `data-pack-size` all return 0.

**The corpus derivation is complete.** 23–27 Aug. All eleven criteria, two reads each, plus a census of 4,227 outline points across 497 manuscripts. Produced fifteen binding rules, four rubric defects, twelve improvement clusters, and a "must never do" list of six things the product would otherwise have shipped wrong. Four instruments survived two reads: I1 agency (r ≈ 0.91 twice, κ = 1.000 on 520 spans), the grain tell (φ ≈ 0.72 twice), TRD/L6, and RI.

**Norms parser built and validated, Parts A and B.** 26 Aug – 2 Sept. `scripts/sermon_parsers.py`, spaCy for I1. **Independently reproduced the corpus's genre confound**: Christ density 11.7 apocalyptic to 2.8 wisdom, a 4.2-fold spread in the same order the gospel clarity reads found. Agency lands at 0.164 against a 0.176 reference. Two screen bugs found and fixed. **Part C not run.**

**Application deep dive built end to end.** 2 Sept. Landing zone, parser, model coding, prose assembly, storage. **$0.36 per run on 17 manuscripts.** Four printed numbers, all stable across identical runs, every quote verified by exact match after Unicode folding. Chris's verdict on the first readable draft: "super great."

**Criterion 8 name drift fixed, and it was a silent-drop bug.** 23 Aug, PR #264. `normalizeLegacyCriterionNames()` did not exist despite being named in the standing rename discipline; it now lives in `src/lib/evaluation/criterion-names.ts` and runs inside `parseEvaluationResult` **before** Zod. A stale criterion name was not mislabeling a row, it was dropping the whole evaluation: four v3.1 rows returned null from parse and were invisible in the app. Unknown name plus valid id now corrects from the id and warns. Stored jsonb untouched; production control confirmed 4 before and after.

**Pack cards unified across both surfaces.** 23 Aug, PR #265. Billing collapsed from three cards to one card with a 2/6/12 size selector matching `pricing.html`, plus the save line it lacked. One canonical tagline set on both. Checkout hrefs route through `buildPackCheckoutPath`. **Billing and `pricing.html` still carry two independent copies of price, quantity and per-credit strings.** Stripe IDs are centralized, so the exposure is display drift rather than wrong charges. Shared catalog parked; build it the next time a pack price actually changes.

**Growth chart rebuilt.** 23 Aug, PRs #266 and #268. One point per sermon at the latest run, rolling four-sermon mean, no line under six, invalid rows excluded by shape rather than score, `scoreToY` clamped so nothing renders outside the plot area, version markers reduced from four to the one boundary that moved the mean, lifetime stat pair at eight sermons, sample-count line, direction copy gated at 0.6. `getEvaluationById` gained the `excluded_from_growth` filter with an `includeExcludedFromGrowth` escape for the sermon page. Direction sentence compares half-means rather than endpoints, after the endpoint version reported "down 0.9" directly beneath a stat pair reading 7.5 to 7.8. Tooltip names a four-sermon average with its titles; markers thinned to `r=2` so the line carries the series.

**Growth route gate and the grandfather shipped together.** 23 Aug. Column, backfill, migration, route gate, rail, library UI and pricing page, all verified. Fourteen accounts hold permanent access. The two had to land in the same deploy, and did.

**Leaked password protection is on.** 19 Aug.

**The null `evaluations_period_start` bug has never fired.** 19 Aug. Zero profiles across all 125. Real in the code, never triggered. Would be silent if profile creation ever changes.

**Migration ledger drift is resolved.** 19 Aug. All three local-only migrations verified present in the remote schema, then marked applied. Local and Remote match on every row. Nothing pushed, no schema changed.

- `20260810140000_signup_rate_events` — fully applied. Signup rate limiting has been running since 10 August; only the ledger was blind.
- `20260818160000_spanish_evaluation_output` — fully applied.
- `20260730180000_credit_functions_service_role_guard` — logic already applied, comments were not. The fixed guard is live; the absent comments fingerprint `20260731150000_record_live_functions` as the migration that actually delivered the 30 July hand-fix. The two `COMMENT ON FUNCTION` statements were run by hand on 19 Aug.

**The trap that was avoided.** `supabase db push` applies pending migrations in version order but executes them *now*. `20260730180000` carries an older version number than the already-applied migration that superseded it, so a push would have run it today and overwritten two live credit functions with a three-week-old body. `create or replace` gives no warning.

**Turnstile is working correctly.** 19 Aug. Hostnames include `sermoncoach.com`, mode is Managed, Supabase CAPTCHA enforcement on. No visible widget in Managed mode for a low-risk visitor is expected behavior, not a failure.

**PR #247**, merged 19 Aug at `b9aa2f1`, verified on production.

---

## Standing lessons

- Set every code agent off `main` with **+ Create Branch** before the first message. Read-only tasks stay on `main` with no branch.
- Commit before testing. Shipped is not verified.
- When a tool reports configuration from an environment it cannot reach, ask for the source.
- Repo docs describe intent, not production state. `SESSION_HANDOFF.md` and `SCHEMA_SPEC.md` have both misled a tool.
- Run `npm run build`, not just `npm run dev`.
- Caps belong in the prompt, where the model can honor them by writing differently. Enforcement after generation can only mutilate.
- **`migration repair` is safe after verification and dangerous before it.** Same command, opposite outcomes, two weeks apart. Order is the whole difference.
- **Do not let load-bearing work live only in a chat thread.** The band ladders sat in one until 12 August, and two weeks of this ledger were built on a picture the ladders file had already corrected. If it matters, it goes in the repo or in this project.
- **When two files can both return 200, a status check proves nothing.** Pick a greppable string that exists in exactly one of them and test for that. This is how the Tier 1 deploy was actually verified.
- **A file in `public/` silently shadows a same-named App Router route.** No warning, no build error. Deleting the old file is part of shipping the new route, not cleanup afterward.
- **A Search Console Domain property needs the full sitemap URL**, not a bare path. Only URL-prefix properties take the relative form. The error is "Invalid sitemap address," which does not say this.
- **The two domains live at different registrars. Run `dig +short NS <domain>` before touching any DNS record.** `sermoncoach.com` is on GoDaddy (`ns75/ns76.domaincontrol.com`). `sermoncoach.online` is on Namecheap (`dns1/dns2.registrar-servers.com`). Editing the wrong zone cost time twice on 21 Aug alone. Also: both registrars auto-append the domain to the Name field, so a host entry must be `@` or the bare token, never the fully-qualified name.
- **Ask DNS, not the registrar UI.** A "conflicts with another record" error usually means the record is already live from an earlier attempt. `dig +short CNAME <host>.<domain>` answers in one second what paging through twenty registrar rows answers in five minutes.
- **Two agents in one repo produces two branches doing the same work.** 5 Sept: Cursor and Claude Code both worked the packs branch, and the same commit existed as `5ce2e26` on the remote and `17150b0` locally after a rebase. Nothing collided because Code staged only its own three paths, but the standing rule exists for a reason. Close one session before opening another.
- **Ship on what is measured, not on what is specified.** The prep card spec describes twelve measures; five have counters. Shipping five with an honest pool note beats waiting for twelve or approximating the missing ones.
- **When two instruments measure the same underlying thing, state the rule once.** Interior/exterior and object-supplied were derived separately, written down as two definitions, and both implemented as grammatical tests. Both were wrong, and the second one was wrong by a factor of six.
- **A count is only printable if its denominator is stable.** Check by running the identical job three times before anything goes on the face of a report.
- **Validate a marker against a hand list before printing it.** The object marker looked fine at 38 of 57 until someone read the 38.
- **A finding from one read is a hypothesis.** Two independent corpus reads on gospel clarity produced an elegant tell and then reversed it. Replication on disjoint material is the only thing that separates a real instrument from a plausible one, and it is cheap relative to shipping a diagnostic that is backwards.
- **A confident narrative over two numbers is the default failure mode.** The 18-year retrospective claimed gospel density fell while load-bearingness rose, and read it as maturation. Both legs fail and the two correlate positively where measured. Nothing caught it until a later read was explicitly told to test it.
- **A verification step that cannot fail is not a verification step.** "Confirm the sermon appears in the library" passes whether or not the fix worked, if a later evaluation of that sermon already renders. Test the ids.
- **Notes about schema are not schema.** Three query attempts on 23 August failed against a jsonb path taken from memory. `result` is the column; criteria live at `result -> 'categories' -> [n] -> 'criteria' -> [m]`; `result->'scoring'` holds only composites and the band. Probe `information_schema.columns` and one `jsonb_pretty` row before writing any query against a shape.
- **A criterion whose scores cluster on one value cannot express variance.** Low within-preacher standard deviation is ambiguous between a consistent preacher and a criterion that does not discriminate. Check the corpus distribution before reading any low number as a fact about a person.
- **Pinning a variable to remove confounding can starve the sample.** Splitting 138 sermons by prompt version left one qualifying preacher. Centering each score on its own version's mean removed the same drift and kept the whole corpus. Prefer correcting to filtering when n is small.
- Verify against the thing, not against the account of the thing. Failures so far: a migration history table that lied, a repo doc read as production config, a competitor's surface read as his depth, a sermon's account of its own passage read as the passage, an invisible Turnstile widget read as a broken one, this ledger's own inflation-check framing retired 12 August and carried forward anyway, and **a fetch tool's 404 read as production state — which then produced a robots list narrower than the live one and would have exposed reset-password, invite, and unsubscribe paths to crawlers.**
