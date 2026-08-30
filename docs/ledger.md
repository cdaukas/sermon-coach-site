# The Sermon Coach: working ledger

**This is the one living document. Overwrite it. Do not date it, do not fork it.**

Supersedes `claude/state-of-play.md` and the Status ledger section inside `sermonscore-competitive-analysis.md`. That competitive analysis stays as the research artifact it is; its ledger has been lifted out and merged here.

Last updated 29 August 2026.

**This version is a merge of two forks, both dated within days of each other.** One carried the Teams, Preaching Lab, mentor-seat and pricing work plus a 200-evaluation calibration analysis. The other carried PRs #270 through #274, #283 and #284, the Framework naming, the derived Grading Bands, the paying-subscriber roster, and roughly ten standing lessons. Neither knew about the other and they contradicted each other on framework naming, criterion 8 and 9 attribution, the Grading Bands rule, and the grader model. **Where they conflict on evidence, the larger sample won; where they conflict on shipped state, production won.** Two conflicts could not be resolved from documents and were settled against `git log`: PR #271 is merged at `97037a4`, and the shadow harness was deleted then reverted then hard-capped and is present on `main`. Both forks were half right about the harness and neither knew a revert had happened in between.

**How to use it.** Items move down, never sideways into a second document. When something closes, delete it or move it to Recently closed. When something is imported from a stale source, it goes in Needs status check until someone confirms it against the running product, not against a doc.

---

## Where things live

Canonical sources. Do not duplicate their contents into this ledger; point at them.

| What | Where | Note |
|---|---|---|
| **Mentor seat production state, verified** | `claude_mentor-step0-2026-08-27.md` and `claude_mentor-step0b-2026-08-27.md` **in the repo root** | 27 Aug. Two read-only passes. **Canonical for anything mentor-seat related.** 0B overturns two conclusions in 0; read both, trust 0B where they differ. Neither is gitignored, so both show as untracked. |
| **Product map: prices, margins, build order, open decisions** | `product-map.html` | 27 Aug. Four buyer columns. Carries every pricing decision made this session with its reasoning. |
| **Flow diagram: who submits, who reads** | `flow-diagram.html` | 27 Aug. Six panels on one grammar: preachers left, instrument middle, reader right. Matched pair with the product map. |
| **Mentoring lane reference: seats, the hold, terminology, relationship model, routing, schema** | `docs/develop-others-canon.md` **in the repo** | **Reference only. It does not track state.** Split from a state document on 28 Aug: its build order, Open list, and Retired section were deleted because this ledger does those better and they went stale weekly. If it ever starts describing what is open or in progress again, that is drift. |
| **Criterion band ladders, all eleven criteria, bands 1 through 5** | `docs/criterion-band-ladders.md` **in the repo** | 215 lines. Added at `08b721d`, last touched at `3a73594`. **Canonical on paper, not shipped.** The definitions the model actually reads live in `prompt.ts` and are thinner. |
| **SEO Tier 1: spec, shipped status, verification evidence** | `claude/spec-tier1-search-visibility.md` | 21 Aug. **Canonical for anything search-related.** |
| RLS archive tables incident | `claude/incident-2026-08-25-rls-archive-tables.md` | 25 Aug. **Post-dates the previous ledger update and has not been folded in.** Read it and pull anything load-bearing up into this file. |
| Search visibility after the .com cutover | `claude/search-visibility-after-cutover.md` | 18 Aug. **Contains a wrong premise.** Read the spec doc above instead. |
| Domain cutover runbook | `claude/domain-cutover-sermoncoach-com.md` | |
| Competitive analysis, sections 1 through 10 | `sermonscore-competitive-analysis.md` | Research artifact, 4 Aug. Its status ledger is merged here and should not be read as current. |
| Melodic line v3.5 reasoning | `claude/melodic-line-v3.5-decision.md` | |
| Recovered branches | `claude/recovered-branches-aug-2026.md` | Now badly incomplete. See Repo hygiene. |
| Growth exclusion and sermon delete spec | `claude/spec-growth-exclusion-and-sermon-delete.md` | |
| 90-day distribution plan | `claude/sermon-coach-distribution-plan-q3-2026.md` | Motion C copy is stale: it points at `sermoncoach.online/start` and pitches the seminary on provenance rather than reps. |
| Professor conversation script | `professor-conversation-script.docx` | 27 Aug. Nine pages, scripted speech for a homiletics professor. Leads with reps. |
| Seminary outreach tracker | `seminary-outreach-tracker.xlsx` | 27 Aug. 19 institutions, three with verified contacts. |
| Spanish reviewer brief, Ask 1 filled in | `Sermon-Coach_Brief_v3.md` | Sent 19 Aug. |

**Filename collision, fix it before it bites.** The `project_content-type_vN` convention produced two unrelated documents both called `Sermon-Coach_Brief_v3.md`. Rename by purpose, not by version.

---

## The product family, as decided 27 August

Full detail with reasoning in `product-map.html`. This is the summary a reader needs before anything below makes sense.

| Product | Price | Seats | Submissions | Who reads |
|---|---|---|---|---|
| The Sketch | free | 1 | unlimited, no auth | him |
| First evaluation | free | 1 | 1, no card | him |
| Coach | $29, going to $39 | 1 | 10 / month | him only |
| Packs | $29 / $69 / $109 | 1 | 2 / 6 / 12, 18-month validity | him only |
| The Intensive | $549 | 1 | 5 to 10 sermons + one deep eval + 60-min call | him |
| Teams | $67 / mo, $670 / yr | 5 | 10 primary, 4 per team seat | each his own |
| + Team Coaching | +$29 / mo, $290 / yr | — | none added | lead pastor, on consent |
| Mentor · Apprentice | $12 / mo | 1 | 2 / month | mentor all, man per setting |
| Mentor · Colleague | $25 / mo | 1 | 4 / month | both, immediately |
| Preaching Lab | at parts, one invoice | any | 2 / man / month | trainer all, man reads debrief |
| Classroom | $25 / seat, 5 min | per term | 4 / seat | instructor all |

**The rule that holds it together.** Dark by default. Visibility is a door the preacher opens by accepting an invitation, never a switch the buyer flips at checkout. A dark tool gets the sermon he is worried about; a visible tool gets the sermon he is proud of.

**Visibility is two axes, not one enum.** Does the mentee get the debrief, and when does he get the score. Four arrangements fall out: Colleague (debrief + score now), Apprentice (debrief + score on release), Preaching Lab (debrief + score never), and the dark option (neither, everything through his pastor). All four are settings on one relationship. No new seat type, no new Stripe price, no three-way choice at checkout.

---

## Open now

### Mentor seats: what is left after billing shipped

**Billing verified end to end on production, 27 August. See Recently closed. What follows is the remainder.**

What is already built and correct:

- The entitlement engine. Per-seat-type capacity, comp debrief seats that can never become evaluation capacity, 2/4 monthly caps on a clean UTC calendar boundary, a write-once release stamp with a trigger guarding it, and the read split enforced in RLS rather than application code. That last choice is the hard, correct one.
- **A complete checkout route.** `GET /checkout?seat=debrief|evaluation[&quantity=1..20]` at `src/app/checkout/route.ts`. Param validation, signup redirect preserving intent, Stripe customer resolution, subscription mode with `checkout_type=mentor_seat` metadata, quantity clamped 1 to 20, success URL on `/dashboard/mentoring`. Matching webhook provisioning exists.
- **Seat-first credit consumption.** `mentor_seat` is a separate track that never enters the free → subscription → pack order. A mentored submission can never touch the mentee's own credits. The mentored branch in `actions.ts` returns before `checkEvaluationEligibility` is ever reached.
- Cancel capacity accounting. Zeroes purchased seats and revokes excess pending invites oldest-first, through `mentor-seat-revoke-pending.ts` using the service role.

What is actually left:

1. **Mentee-side view of the paired sample, and a public page for it.** Much smaller than "build a sample," because the mentor side is already live and populated with a real mid-band sermon at 8.2.
**The allowlist is off. Mentoring is live to real users as of 29 August.** Seat billing, termination on cancel, the seat-end email, the dark visibility option, and the neutral-pronoun copy pass are all in production and now visible.

**Two things that were theoretical are now reachable, and both should be watched rather than assumed.**

- **The acceptance handoff has never completed with a real person.** Zero real mentees have accepted an invite in production; every accepted relationship belongs to a `cdaukas+` test address. The first real acceptance is a live test of a path the code supports and nobody has walked. Watch it closely rather than trusting it because it deploys.
- **The mentee/paying-preacher credit bypass is now buyable into.** See the entry below. A staff member holding a seat and paying for his own Coach would have every submission draw from the seat.

What remains in the lane: the mentee-side paired sample and its public page, which is smaller than it sounds because the mentor side is live and populated with a real mid-band sermon at 8.2. Name-first checkout stays parked.

Order matters on what is left. Visibility should ship before name-first, because name-first passes the mentee email and the visibility choice through the same Stripe metadata. Build visibility second and name-first carries it. Build name-first first and you go back to add a field to both the metadata and the webhook.

Name-first has an unknown at its centre: `create_mentor_invite` reads `auth.uid()` and the webhook has no session. Same blocker the cancel work hit. Until Step 0 answers whether the webhook writes the row directly with the service role or gets a service-role variant of the RPC, the estimate is soft.

### The pricing page promises things the code does not do
**Largely resolved 27 Aug.** The two seat cancellation answers were rewritten and shipped with PR #285, and the behaviour they describe is now built. What follows is the record of what was wrong and why, kept because the reasoning matters.


`pricing.html` carries twelve seat promises in its own FAQ block. Five are honoured, one is honoured by Stripe rather than by us, and six have no code.

The one that matters most is **inverted, not merely missing.** The page says unreleased work goes to the mentee when the seat closes. The actual behaviour is the opposite: an unreleased diagnostic on an Apprentice seat becomes **permanently unreachable** to him, because his RLS read requires `released_to_mentee_at IS NOT NULL`.

Nobody has bought a seat, so nobody has relied on it. Fix the copy down to a defensible policy first, then build only what survives:

- **Keep** "when the seat closes, the relationship it was paying for ends." Worth building.
- **Cut** "anything unreleased goes to him, unless you tell us to hold it." No hold mechanism exists and it contradicts the Apprentice model. Replace with a warning at cancel: release anything you want him to keep.
- **Cut** "we email you and ask which relationship to close." No such email exists anywhere in the codebase. Replace with the rule the code already implements: oldest closes first.

Note these promises are on `pricing.html`, **not** `faq.html`. An audit of the FAQ page finds nothing.

**Third, smaller, and in the app rather than on the marketing site:** the Apprentice seat card in the mentoring dashboard says the scored evaluation is *"held until you release it."* In the Preaching Lab, release does not exist. That copy needs a Lab variant before the Lab ships.

**Same class of problem, second instance:** the Classroom card promises credits "pooled across the class." Pooling has never been built and the decided model is a per-seat monthly cap. The cheap fix is the copy.

### The mentor lane was paused on purpose, and that context nearly got lost

Seven unaccepted invites and zero real mentees are **not a broken funnel.** Chris stopped the mentor lane deliberately and told subscribers, in order to get the core evaluation, the Sketch, the homepage, and the copy into better shape before selling four ways to access the product. He then gated it down to his own account.

Consequence: the acceptance handoff is **untested, not proven.** The first real one should be watched closely rather than assumed to work because the code exists.

### Tyler's objection is a product specification, and it is the only real user signal in this lane

Tyler James sent one invite and withdrew it. Not on price and not on timing. He did not want an AI product sending his guy anything directly. He wanted to be the moderator, holding what came out and deciding what reached him and in what words.

That is what the dark visibility option answers. But note what Tyler **actually did** before any of this existed: he submitted another man's sermon on his own Coach account and hand-prefixed the title.

**Unresolved, and it is one text message:** does the man submit his own sermon, or does the mentor submit it for him? If the latter, this is not a seat at all. It is a label on a sermon under the mentor's own account, with no invite and no second login, which skips the one step that has never completed in production.

### Preacher-name field, to retire the growth exclusion flag

Tyler's workaround created a real problem, and the exclusion flag patched the symptom. The disease is that another man's sermon sits in Tyler's library indistinguishable from his own except by a title he typed.

That cost compounds. Every future feature has to remember the flag: growth, history, search, PDF, streaks, the Monday digest. One forgotten join and it is back.

**Minimum honest version:** one nullable field at submission, "whose sermon is this?" A name entered means excluded from growth automatically, tagged in the library, and **the report header carries the preacher's name.** That last one matters more than it looks: the debrief is written in second person, so a PDF handed from Tyler to Joe currently points "you" at the wrong man.

Open shape question: free text on the sermon (one day, reads as a label) or a small list of men the mentor is developing (two to three days, gives Joe's arc across four sermons). The second is the real product and also starts looking like a seat without the seat.

### Seats as acquisition: a reasonable bet, unproven

The argument: the shortcut is a dead end by design. Joe never gets an account and never sees the interface, so the pathway produces exactly one customer, Tyler. A seat is a distribution channel where the mentor pays for the trial, and when the seat ends Joe keeps his account and his library.

Nine of twelve subscribers came from three or four networks. Seats are the only mechanism that reaches someone outside them, with the mentor doing the introducing.

**No one has ever converted this way. Too new.** So hold it as a bet, and do not let it drive scope. What it earns is one hour inside a build already happening: **when a seat ends, send the mentee an email with his library and what a plan of his own costs.** Silent expiry tests nothing. If a year passes with no conversion, seats are a mentoring feature and not a growth channel, and that is worth knowing.

Note the tension: the dark visibility option is the **acquisition-weakest** arrangement. Joe logs in, uploads, and reads a handoff screen. Technically in the ecosystem, experientially nowhere. Default to the debrief; offer the dark version to mentors who insist.

### Two small items for whatever touches the seat-end email next

The greeting falls back to "Hi there" even when the relationship carries a `mentor_label`. It reads the mentee's own `profiles.display_name`, which nobody signing up through an invite ever sets. Now that the mentor types a name at invite time, the greeting should fall back to `mentor_label` before "Hi there".

Keep going renders as bare underlined text under two paragraphs of prose, so it reads as a footnote rather than the action it is. Template change, worth weighing against deliverability.

### Failed seat-end sends are still invisible

A mentor whose email failed does not know, and neither does Chris unless someone queries for `status = 'ended'` with `seat_end_email_sent_at IS NULL`. Every exit now logs, so a failure is findable in Vercel, but nothing surfaces it. Fine at this volume. Either a line in the Monday operator digest or a retry sweep, whenever it matters.

### Seat counting could exceed capacity before the 6 August guard

The panel read **"Apprentice: 2 of 1 seat in use"** on 27 August: one comp seat, two relationships counted against it. Created 5 August, one day before `create_mentor_invite` started gating on `v_used >= v_capacity`. Cleared by revoking the stale pending invite.

Nothing real was affected and the guard now prevents it. Worth knowing only because the panel renders as broken when it happens, and because `revokeExcessPendingMentorInvites` runs on every seat write, so an over-capacity state resolves itself unpredictably the next time a subscription changes.

### Teams is two different products and the ledger conflated them

**Teams as sold today: Coach for the lead pastor plus Colleague seats for the staff, hand-provisioned through a Tally form at `tally.so/r/xX5kJJ`.** $29 for the lead, $25 per additional preacher. Lead keeps ten evaluations, each additional preacher gets four. Zero build; the machinery already works. The card is live on the pricing page, first in the Develop Others row.

**Teams as an automated product: 12 to 16 focused days, 16 to 24 with Team Coaching.** Not the 5 to 8 this ledger carried. That number predated a real Step 0 and was wrong.

Cursor's diagnosis, 29 Aug, is unambiguous that it needs its own tables. `mentor_relationships` cannot carry a team without a guard on every function that touches it. The single clearest reason: `requestEvaluation` hijacks any active relationship into `create_mentored_evaluation`, so a team row in that table would steal the primary's credits and block a member who also has Coach. That is not a guard you add, it is a product breaking.

Other blockers from the same audit: the partial unique index means one active relationship per mentee, so a lead who also mentors could not sit in both; `accept_mentor_invite` is an accept machine and Teams is notify-not-ask; `is_mentor_of_relationship` would give the buyer a full evaluation SELECT when Teams is dark by default; `create_mentored_evaluation` always inserts a pair with a hold, which a private team submit is not.

**Automate at church three**, the same rule Classroom follows. Sell by hand until then.

### A person who is both a mentee and a paying preacher has their own credits bypassed

Found 29 Aug while reasoning about an associate on a Teams church who also mentors someone himself.

`requestEvaluation` routes to the mentored path whenever the submitter has any active relationship as a mentee. So a youth pastor holding a Colleague seat from his lead pastor and paying for his own Coach subscription would have every submission draw from the team seat, and his own ten would never be used.

This is live today, predates the team-account flag, and applies to any mentee who also pays. Not urgent at current volume, since no real mentee has ever accepted an invite. Worth fixing before a Teams church has a staff member who is also a customer.

### The non-affiliation disclaimer is on one page, not the site

Audited 29 Aug. The ledger has said the disclaimer is "currently live" sitewide. It is live on exactly one page: `how-its-scored.html`.

`faq.html` and `story.html` both name all six sources and carried nothing. Fixed in `legal/disclaimer-faq-story`. `pricing.html` names none of the six and correctly needs none.

**Five blog posts name a source and carry no disclaimer**, and Chris has decided they stay that way: `any-text-sermon-fix` (Simeon Trust), `borrowed-burden-sermon` (Chapell), `one-sentence-sermon` (Robinson, Simeon Trust), `preach-to-specific-kinds-of-people` (Keller), `sermon-that-ended-at-try-harder` (Chapell).

The reasoning: a post citing Chapell on the Fallen Condition Focus is ordinary attribution, the way any writer cites a book. `how-its-scored.html` is different, because it presents those six as the authority behind a product being sold. **Worth putting to whoever reviews terms and privacy, since neither Chris nor Claude is a lawyer and this is the one area with real exposure.** Not a build decision.

### No comp path for evaluation seats

Every capacity function hardcodes evaluation comp to zero. `comp_debrief_seats` is the only comp column. A comped Colleague seat is not expressible.

Writing `purchased_evaluation_seats` by hand gets clobbered on the next webhook re-sync, because `setPurchasedMentorSeats` writes an **absolute value, not a delta**. Either add `comp_evaluation_seats` and teach the three capacity functions about it, or accept that Colleague seats cannot be comped.

### Three findings from the SermonScore diff that this ledger had lost

**All three come from `sermonscore-competitive-analysis.md`, section 8, and none of them are competitive items. They are quality defects the diff happened to surface.**

**1. Two criteria reached opposite verdicts on the same evidence, on the sermon that is now the public sample.** The phrase "career, building a nice family, taking nice trips" is credited as a strength under criterion 7 for naming the modern rivals, and flagged as a weakness under criterion 9, where the fix is to give one drift its face. The competitor read it as generic, full stop. **This is on Hebrews 3:1-6, which is `/sample-evaluation`.** Read the live page: if both statements are still there, a careful pastor comparing two sections of the shop window finds the product contradicting itself. Cross-criterion consistency, not a scoring error, and the kind of thing a reference set should be watched for.

**2. The growth-edge instruction settled on 24 August has no rule for 5s.** It covers 1 through 3, which name the movement, and 4, which gets concreteness with no number. It says nothing about a 5. The diff found that "to hold this" appeared on every 5, so three of eleven criteria gave the pastor no improvement at all, only maintenance. **A perfect score has no next rung, so the field defaults to praise**, while the competitor's growth edges never mention a score and therefore always have something to say. Close the gap before 4.1 ships. The likely answer is that a 5 gets an observation about what makes it work rather than a growth edge at all.

**3. Two rules pull in opposite directions and one of them wins when the ladders ship.** The diff concluded that a criterion cannot reach 5 while a load-bearing element of that criterion is absent, after gospel clarity returned 5/5 on a sermon that never names the resurrection while calling for living hope. The band ladders file says under criterion 3: *"Completeness is measured against the passage, never against a doctrinal checklist. Do not penalize a sermon for omitting an element the passage does not raise."* Hebrews 3:1-6 does not raise the resurrection, so the ladder says do not penalize and the diff says the omission is load-bearing because the sermon's own appeal rests on it. **Both are defensible. Decide before the ladders go into the prompt, because whichever wins is a scoring behavior.**

### Two competitive gaps: one unbuilt, one narrower than it looked

**No file upload of any kind.** SermonScore takes .txt, .md, MP3, MP4, M4A and WAV. The Sermon Coach has two paste-based tabs. **The .txt and .md path is nearly free** and covers the pastor who has a manuscript file and does not want to open it and copy out of it. Audio is a real build and stays deferred.

**This matters more now than it did in August, because of the Preaching Lab.** Eight lay men across twelve weeks is up to forty-eight submissions by people new to the product, and a lay preacher writing in Word is likelier to have a file than a pastor who lives in his manuscript app.

**Self-serve billing is built and good. What is missing is discovery.** Verified 29 August by reading the live Billing page, which closes the unverified half of competitive item 2.13.

**What the page already does well.** Coach named with its cap. Subscription credits with a reset date. Pack credits with the consumption order stated in plain words: *used after those run out.* Seat count with cost per seat and monthly total. Three working controls: Manage subscription, Add credits, Manage seats. This is a better billing surface than the competitor's and it needs no work.

**The gap: every element on the page describes what the subscriber already has.** A Coach subscriber whose church just hired two preachers sees nothing about Teams. Nothing about the Preaching Lab, Classroom, or the Intensive. Nothing about annual, which is a conversion worth having and which this page could surface at the exact moment someone is looking at what they pay.

**Brief A is done**, which is what shipped the plan card, the credits line and the seats block. **What it did not settle is the Lab case:** what this page renders for a buyer who holds no Coach subscription and no packs. See the Preaching Lab entry.

**The discovery gap is one block, not a build.** Three or four lines at the bottom of Billing naming what else exists with prices, linking to the pricing page. **Worth doing before the Lab ships**, since the Lab is the first product an existing subscriber might plausibly buy as a second thing, and a logged-in subscriber may never see the marketing pricing page again after converting.

**Two smaller observations from the same screen.** The headline subscription number reads **0 of 10** with 23 pack credits beside it, which is correct behaviour and clearly explained but still means the first number a subscriber sees is a zero; worth deciding whether that reads as *you are out* at a glance. And the page says *"You're mentoring 2 people"* under a **Developing Others** header while the rail says **Mentoring** and the pricing page says **Develop Others** with Apprentice cards. Three variants on one screen. The vocabulary split is recorded elsewhere as deliberate; this is the place it is most visible.

### Competitive-use clause for terms, drafted not shipped

Requested 29 August. Draft, narrow on purpose:

> **Permitted use.** Your account is for evaluating your own preaching, or the preaching of those you are developing through a seat you hold. You may not use the service to build, train, or improve a competing product, or to extract the evaluation criteria, band definitions, scoring logic, or report structure for use elsewhere. Automated access, scraping, and bulk submission for the purpose of reproducing how the service works are not permitted. We may close an account we believe is being used this way.

**Written narrowly at extraction and account termination rather than at "competitive advantage" broadly**, which is vague enough to be unenforceable and broad enough to look bad.

**What it does and does not buy.** It makes scraping and systematic extraction a breach rather than merely rude, gives a basis to terminate an account, and signals the rubric is treated as proprietary, which is the condition for trade-secret protection. It does **not** prevent what actually happened in the other direction: a free-tier signup, a read of the public rubric, and a written analysis. That claim would require identifying the person, proving acceptance, and proving competitive use, which is not a suit this business would bring.

**Note the asymmetry honestly.** The competitive analysis in this project is the conduct the clause would prohibit. That is ordinary competitive research, and SermonScore has no terms posted at all, so there was no contract to breach. It still reads differently if anyone puts the two facts side by side.

**Goes to counsel with the pile, not alone.** Terms, privacy, the ™, and the authorship paragraph are all unreviewed, and this clause is the one most likely to be tested by someone with a lawyer.

### Preaching Lab is a hand-sold configuration, not a build

**Reversed 29 August. The fixed product is not being built. What ships is a Tally form, hand provisioning, and one invoice.**

**The reasoning, and it is the Teams move again.** A Preaching Lab is a collection of Apprentice seats: each man reads his coaching debrief and how it preaches, the trainer holds every score. Nothing in the Lab spec requires a mechanism that does not already exist. Two submissions per participant per calendar month is the Apprentice cap. Debrief-without-score is the Apprentice arrangement. Dark is `mentee_reads = 'none'`, shipped in PRs #293 to #295. Artifacts permanent on both sides is already true.

**The fixed spec was inventing constraints nobody asked for.** Eight people, twelve weeks, one visibility setting for everyone. None of those came from a trainer. A four-man cohort running eight weeks is a real thing pastors do and the fixed product would have refused it.

**Variation is free because seats are per-relationship.** Four seats or twelve is a number provisioned. Eight weeks or sixteen is a date written down. Debrief, full, or dark is a per-invite choice that already exists. **This is the advantage no fixed product could have:** two seasoned men on Colleague seeing everything immediately, four new men on Apprentice held, one dark because his pastor delivers it in person, all in one cohort.

**Pricing: no discount, one invoice.** Apprentice $12 per preacher per month, Colleague $25. Eight men on Apprentice for three months invoices at $288. Twelve on Colleague for four months is $1,200. A mixed cohort of 2 Colleague and 6 Apprentice over three months is $366. **The earlier $249 flat price is retired**; it was a 14 percent discount on parts, and at twelve participants it would have been underwater. What the trainer buys is that he does not assemble it and does not run twelve subscriptions, which is a real service and needs no price cut to justify it. Margins hold near 85 percent at every shape: 8 men over 3 months is 48 paired evaluations at roughly $44 against $288.

**The Tally form, drafted 29 August.** Trainer name, email, church, and where the men come from. Term start date and length. Participant count. Then a repeating group per man: name, email, what he sees, and an optional note.

**Question 8 is the fork and it must be in the form: who submits the sermons, each man or the trainer on their behalf?** If the trainer submits, there are no seats, no invitations, and no accounts. That is a label on sermons under his own account, and it skips the acceptance step **that has never completed once in production**. This is Tyler's unresolved question in its natural home, and the form should catch it rather than provision eight seats nobody accepts.

**One consent line is doing legal work.** A trainer handing over eight third-party email addresses is a privacy question. The form states that each man gets one invitation and nothing else, and is added to no list. **That is not a substitute for the counsel review** privacy is already queued for.

**What the built version would have cost, and why the estimate is not wasted.** Cursor sized the self-serve product at **14 to 22 days** with the trainer queue excluded, 19 to 29 with a real queue. Six phases: own tables and hand-applied migrations, trainer and participant surfaces, the submit path, Stripe and the Billing page, term dates, and growth filtering. **That estimate is the spec for whenever this automates**, and it surfaced three things the hand-sold version still has to respect:

- **Never call `create_mentored_evaluation` for Lab work.** That pair plus `end_mentor_relationship` is how scores leak, and no-scores-ever is the defining constraint.
- **If it is ever automated, route sermon-level, not person-level:** this sermon belongs to a Lab, then mentee relationship, then personal credits, in that order. Person-level routing captures a participant's own Sunday sermon as Lab work; leaving the mentee check first means someone in both lanes can never submit Lab work at all.
- **The Billing page tells a Lab-only buyer "You're not on a plan"** with a Coach pitch and no Lab line. Moot while invoicing by hand, real the moment checkout is self-serve.

**Three things that stay manual and are the actual work.** Provisioning the seats. Writing down the term dates. Never pressing Release. On the debrief arrangement the release control renders; hand-run that is discipline, and **it is the one thing that becomes a build the moment another trainer runs a Lab**, because a trainer who declines to press it becomes a gatekeeper explaining a decision about a man.

**Build trigger: automate at trainer three**, or earlier if tracking concurrent terms on different clocks costs more than an afternoon a term.

**Open before the first cohort.** The invite seam check, since eight strangers hitting an untested acceptance path simultaneously fails for all eight at once, in front of men Chris has a pastoral relationship with. Invite two before eight. And **no file upload exists**, which matters more for lay men writing in Word than for pastors who live in a manuscript app.

### Sermon delete purge job

Daily hard delete after 30 days, archiving to `_admin_row_archive` first and logging what it purged. The window opened at the #247 merge, so the first rows become eligible **18 September 2026**. Nothing is built. See also the 25 Aug RLS archive tables incident, which has not been folded into this ledger.

### The overreach number is suspect, and it gates the biggest build on the board

Open item 7 from the band ladders file. The shadow run reported 2 to 6 overreach flags per sermon, median 4, across 17 sermons. That figure is load-bearing for the passage-first pass in 5.1a. But therapon was one of those flags and it was a false positive.

Hand-audit three or four sermons and sort every flag into real overreach, defensible reading wrongly flagged, or genuinely contested. If the false-positive rate is high, the finding that justifies the whole passage-first pass is inflated. **This no longer gates 4.1**, since passage-first was cut from that bump on 24 August. It gates only whether passage-first ever gets built. Chris's own judgment, not a build.

**What decides whether passage-first is ever built.** Criterion 1 is the plausible case for it: textual fidelity concentrates at 4, possibly because the model has no independent basis for disagreeing with the sermon's reading. **So read criterion 1's distribution specifically after 4.1 ships.** Ladders pulling it off that concentration means passage-first was never needed. Criterion 1 staying flat while other criteria move is a measured argument for building it, with its effect isolated rather than guessed.

**Check the corpus before you check the flags.** The shadow gate harness turned out to be running on six sermons that production had already scored 4 or 5, which is why it reported invariance. If the overreach run used a similarly narrow or top-heavy selection, the flag rate is a property of the corpus rather than of the prompt. Ask what was in the sample first.

### The gold fails AA on cream, site-wide

**Found 23 August while fixing an inherited rule. Not urgent, and it is a real accessibility defect that predates everything else on this board.**

`--accent` on `--bg` measures **3.57:1**. It cannot reach 4.5:1 at that hue and lightness. **Every gold eyebrow sitting on cream anywhere on the site is below AA for normal text**, not only the one that was fixed.

Two scoped tokens already exist: `--accent-on-cream: #8d6927` at 4.73:1 and `--accent-on-dark: #b08431` at 4.65:1. `--accent` itself was left unchanged, so four golds now exist where one did.

**The likely simplification is a sweep, not a design decision:** `--accent-on-cream` replaces `--accent` everywhere gold sits on cream, across `how-its-scored.html`, `pricing.html`, `faq.html`, `story.html`, `why-sermon-coach.html`, and the blog. **Also verify** that `.section--dark:not(.testimonials--inverse)` did not overreach; What It Is, Who it's for, and the closing CTA should still render eyebrows in `--accent-soft` unchanged.

### `/why-sermon-coach` 404s without the `.html`

**Found 24 August during the newsletter band verification. Low priority, nothing broken today.**

`https://sermoncoach.com/why-sermon-coach` returns 404. `/why-sermon-coach.html` serves correctly and the homepage AI beat links to the `.html` form, so no live link is dead. The exposure is outreach replies, where the URL gets typed by hand and dropping the extension is reasonable given `/pricing` works.

**The asymmetry is the more useful finding.** `/pricing` rewrites and `/why-sermon-coach` does not, so something strips extensions for some pages and not others. Worth knowing what that rule is before adding a one-off alias: **if it is an explicit list, every static page shipped from here carries the same gap.**

### Preview deployments are public

Vercel Authentication is off. If turned on, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` can be blanked on Preview only. A second Turnstile widget does not work: the secret is one project-wide Supabase Auth setting.

**Not an SEO problem.** Vercel sets `X-Robots-Tag: noindex` on preview deployments automatically. This item is about public *access*, not crawling.

### Sample pages

**Resolved, verified by curl 23 August.** `/sample-evaluation` and `/sample-sketch` are both live on Hebrews 3:1-6, 43/55, 7.8/10, band Strong, and the three old static samples all 301 to `/sample-evaluation`. The claim that two of three samples are Exemplary is stale and should not resurface. **This also closes item 9.2**, since both public samples now render from database rows carrying `is_public_sample`, which is why the sketch page can be changed by SQL with no redeploy.

**The "bands publish with 4.1" rule was retired on 24 August in PR #274, not broken.** See the 4.1 section. The table is now derived from the cut points rather than hand-typed, and 47/39/30/22 are a locked public commitment.

**One hazard survives from the SQL-editable sample.** There is no diff, no PR, and no review between an edit and a live marketing surface. The `begin` / `update` / `select` / `rollback` dry run is the entire safety net, and a bare `rollback` at the end hides the row count above it, so put the verification `select` immediately before it.

---

## Distribution

### The Evangelical Homiletics Society meets 15 to 17 October 2026

Talbot School of Theology, Biola University, 13800 Biola Ave, La Mirada, California. Regular admission $175. Membership is drawn primarily from people who teach homiletics at seminaries and Bible schools.

That is the entire institutional buyer list in one room, in the right theological lane, roughly seven weeks out. Worth more than twelve cold emails. The 2027 venue is not announced; EHS posts only the next meeting.

**Not the Academy of Homiletics.** That is the mainline guild, different literature, different tradition. Do not send there.

### The seminary pitch is reps, not better feedback

A homiletics professor is excellent at evaluating sermons; telling him the instrument gives good feedback tells him you do his job slightly worse for money. The argument that lands:

**A student preaches three times in his course, maybe eight across the degree, then goes out and preaches forty-five times a year for thirty years.** That is a throughput problem, not a standards problem, and it exists because faculty read-time does not scale. Full script in `professor-conversation-script.docx`.

Second argument, for a dean rather than a professor: **assessment.** Per-criterion, longitudinal, exportable evidence of a learning outcome that is notoriously hard to evidence. Institutions pay for compliance pain more readily than for pedagogy.

Third, saved for last: **growth over time.** First sermon year one against last sermon year three, same eleven criteria.

**Provenance is the objection-handler, not the selling point.** It answers "I am not letting an AI grade my students" by pointing out the criteria are already on his syllabus.

**Pricing frame: a course lab fee, not software.** Twelve seats across a four-month term is $1,200, or $100 a student. Presented as software it is procurement. Presented as a lab fee the registrar already has the mechanism, and it may be the students who pay.

**Ask for a free pilot term, not a sale.** Fall syllabi are locked; spring decisions get made in October and November. Hand-provisioned, instructor seat free, and the ask is his criticism.

### Preaching Lab is the bigger market and it needs no seminary

Church-based training of lay men. There are a few hundred homiletics chairs in America and thousands of pastors running some version of a men's preaching cohort. Chris is one of them; GTN is this at scale.

**The pitch is preparation, not reps.** The work in coaching a young preacher was never the talking, it was reading a sermon cold and working out what to say. That is what kills labs: four weeks in, it is Tuesday and the trainer has not read anybody's manuscript. Forty-odd prepared reads is less work than eight unprepared ones. *"The labs you have tried before died because you could not keep up. This one does the preparation so you only do the pastoring."*

The eleven one-sentence verdict lines are what make that true, since they let a trainer skim a report in ninety seconds.

**The objection:** almost every preaching lab in existence is free today. Four men, a room, a Chapell book, a Tuesday morning. $349 was rejected because eight Apprentice seats assembled by hand for three months is $288; $249 sits under the parts and well under a $150 to $250 per head weekend workshop.

**Distribution is still the finding nobody has acted on.** See `claude/sermon-coach-distribution-plan-q3-2026.md`. The constraint is not the report.

---

## Evaluation quality

**Opus is locked, decided 24 August. Do not reopen this as a model question.** The earlier finding that Sonnet named a gap where Opus gave 15/15 is real, but it is a band-ladder problem rather than a model property, and Opus writes the narrative prose better, which is the deciding property. See Decided.

**`getEvaluationModel()` should throw, not fall back.** `EVALUATION_MODEL` was never set in Vercel, so the `claude-opus-4-8` fallback has silently chosen the grader since 7 June. The fallback happens to be the model now locked, so nothing scored wrong. The defect is that the choice was never made deliberately and would move silently if the constant changed. **Related and load-bearing for any local work: `.env.local` sets `EVALUATION_MODEL=claude-sonnet-4-6` while production is Opus, so every script must pass the model explicitly or it silently scores on the wrong one.**

**Temperature is unset and the noise floor stands at roughly 0.55 on display.** Growth Report movement under 0.6 is noise. The plan to set temperature explicitly and re-measure was superseded by the corpus distribution queries. Note for the record: the three-run Opus test that produced 50, 50, 53 and that 0.55 figure **has no rows in `sermon_evaluations`**, so a number quoted in several places has no queryable evidence behind it.

**Floor guard, and pull the 11/55 row.** A failed evaluation can render as a real score. One came back 11/55 where the observed floor across the corpus is 28. Chris's own account, so no customer saw it, but exclude it before it lands in any corpus statistic.

**Bands were calibrated on working preachers.** Faithful starts at 30. Lay men in a Preaching Lab will land under it routinely. Held-by-default scores mean the number never reaches them unrehearsed, which is most of the mitigation. Still worth seeing what the report renders below the lowest named band before a trainer ever releases one.

**Criterion 1 is being scored. Thread closed 27 August.** Four shadow sets showed criterion 1 completely invariant, which raised the question of whether it discriminates at all. A read-only query across 200 scored evaluations settles it: the five-rate went 3.0% at v3.2 to 29.8% at v3.3 to 3.7% at v3.4. That is a rubric response, not a frozen output. No reshaping of 4.1 follows.

**The shadow harness has a selection defect, and it cost about $45 to find.** `PINNED_SERMONS` holds six manuscripts, and production had already scored all six at criterion 1 of 4 or 5. Four sets re-scored a corpus with no low end in it and reported that nothing moved. That is a selection artifact, not invariance. **If the gate language does anything it does it at the bottom, and the bottom was never in the sample.** Add a low-scoring sermon to `PINNED_SERMONS` before any further gate work. Costs nothing.

**The full eleven-criterion distribution, v3.5 only, 330 scores across 30 evaluations.** Narrower than the 200-evaluation analysis above and consistent with it.

| id | criterion | 1 | 2 | 3 | 4 | 5 | mean | 3 or below |
|---|---|---|---|---|---|---|---|---|
| 1 | Textual fidelity | 0 | 1 | 2 | 24 | 3 | 3.97 | 10% |
| 2 | Christ-centered arc | 0 | 0 | 2 | 11 | 17 | 4.50 | 7% |
| 3 | Gospel clarity | 0 | 0 | 4 | 21 | 5 | 4.03 | 13% |
| 4 | Fallen Condition Focus | 0 | 0 | 9 | 16 | 5 | 3.87 | 30% |
| 5 | Structure | 0 | 0 | 8 | 20 | 2 | 3.80 | 27% |
| 6 | Hard things handled | 0 | 1 | 10 | 15 | 4 | 3.73 | 37% |
| 7 | Application | 0 | 5 | 8 | 15 | 2 | 3.47 | 43% |
| 8 | Emotional arc | 0 | 0 | 15 | 14 | 1 | 3.53 | 50% |
| 9 | Pastoral specificity | 0 | 4 | 12 | 10 | 4 | 3.47 | 53% |
| 10 | Ecclesial faithfulness | 0 | 0 | 1 | 20 | 9 | 4.27 | 3% |
| 11 | Expository exultation | 0 | 0 | 10 | 17 | 3 | 3.77 | 33% |

**Twenty-eight percent of all v3.5 scores are 3 or below**, and seven or eight criteria show healthy spread. **This confirms the published scale copy from PR #281:** "most faithful weekly preaching lands at 3 on several criteria" is accurate.

**Which criteria carry affirmation and which carry development is a measured fact.** Criteria 1, 2, and 10 sit at 3 to 10 percent below a 4 and are close to constant: they tell a preacher he is doing well and little else. Criteria 6, 7, 8, 9, and 11 run 33 to 53 percent at 3 or below and are where coaching lives. **The report-design question that follows: does the criterion table treat all eleven as equally trackable, producing three flat lines and a subscriber wondering what he is paying for, or lead with the five that move and name the three that hold as sustained strengths?** Decide before pricing any tier on tracking a preacher. The quarterly deep dive should start on a high-variance criterion; application is already first in the plan.

**Hand review, 27 August: the three lowest criterion-1 sermons were read and all three are correct.** Isaiah 23 scored 2, and the stated passage is never opened while the whole sermon runs on Isaiah 49, which is textbook springboard; the read still credits the Servant-as-Israel handling as careful. The Reason for God scored 3: "the texts function more as supports for a philosophical argument than as the source that generates it." Numbers 13 scored 3, crediting structural fidelity then naming two specific overreaches, **which means the overreach mechanism worked without the passage-first pass.** Criterion 2 was spot-checked the same way on the four lowest-composite sermons that still earned a 5, and each names a specific mechanism rather than praising generally.

**Scale compression is a scale question, not a criterion-1 question.** Criterion 1 has the lowest spread at sd 0.511, but criterion 10 is 0.024 behind it and criterion 8 is close too. Three criteria cluster tight; criteria 2, 3, and 6 use the full range. This is what the 4.1 band ladders were already meant to address.

**Score 1 is functionally unused.** Across 200 evaluations and 2,200 criterion scores, zero 1s and 34 2s. The bottom two rungs are 1.5% of all scores. The scale has a floor, which the 12 August finding established and which still stands. But 1 does not occur, and that is worth knowing before 4.3 publishes band definitions describing a five-point scale where one point never appears.

**Twelve complete evaluations carry a null result.** Six percent of completes produced no criteria and still rendered as complete. Chris has declined to investigate for now. Recorded so it is not rediscovered as a surprise.

**Passage inventory, remaining 46 diffs (Track 0.2).** Shadow-mode run crashed at row 18 on a JSON parse error. See the overreach audit; the conclusion this run produced is the thing now in question.

**Cold reference set (Track 0.1) is background, not a gate.** Downgraded 12 August.

---

## The consolidated prompt edit (4.1)

One edit, not four. Ships all at once.

**Contents, as of 12 August:**

- The eleven band ladders from `docs/criterion-band-ladders.md`, replacing the thinner definitions in `prompt.ts`
- The five presumptions, stated inline inside band definitions, never as a separate pre-scoring pass
- One nullable boolean per criterion row recording a presumption override. No reason string in the schema
- **The passage-first pass from 5.1a is OUT**, cut 24 Aug. Still spec rather than built. Reasoning below.
- The three changes already held: criterion 7 grace-motivation cap, criterion 4 functional-centrality cap, emotional-arc Piper reframe
- **The growth-edge instruction, settled 24 Aug and quoted below.**
- **The criterion 8 `Sermon-coach` slug**, which prints where a source name belongs on the report surface. `how-its-scored.html` was fixed in PR #273; `prompt.ts` was not.

**Cut on 12 August: the symmetric inflation check.** The 8.2 finding that the scale had no floor was retired when the first mid-band submission from a stranger returned 31/55 on v3.4 with three 2s, four 3s, four 4s and no 5s. The scale has a floor; it had not been shown one.

**Gated on: nothing.** The passage-first pass was cut and the overreach audit was parked.

**Why passage-first is out.** The idea is sound: the model forms its picture of the passage largely through the preacher's account of it, which is the failure already named in the standing lessons. But its justification is parked, since therapon was a demonstrated false positive and the shadow run crashed at row 18 with 46 diffs unprocessed. It is still spec, so the full cost is ahead: a second inference step, more tokens, a new failure mode when the passage read is itself wrong. And it would contaminate the acceptance test, since divergence rising could then be the ladders or the passage read with no way to separate them. **The overreach entry in Open now adds the decisive caution: check what was in the sample before trusting the flag rate.**

**Growth-edge framing rides in this bump, settled and written.** Verbatim:

> Every growth edge names what is missing and what would close it, built from what the preacher already put on the page.
>
> When the criterion scored 1, 2, or 3, state the score movement the fix produces: "To reach a 4, ..." Name the behavior, not the posture.
>
> When the criterion scored 4, do not name a score. Describe what the sermon would do differently, in the same concrete terms, with no reference to the rubric or to a number.
>
> Never write "to reach a 5."

Scores 1 through 3 name the movement because a fix aimed at the next rung is more useful than one aimed at perfection. Score 4 gets the same concreteness without a number, because fives are meant to be scarce and criterion 2 already awards one on 59 percent of scores. **It cannot ship separately:** 4.1 moves the 3-to-4 boundary and 3-to-4 is the boundary the prose names most often.

**Acceptance test, written before the experiment.** `composite_simple` and `composite_weighted` are currently identical on 54.5% of evaluations and within one point on 98%. If 4.1 restores 3 as a working anchor, divergence should rise. If the distribution looks the same afterward, the edit did not do what it claims regardless of where the mean moved.

**The "publishing band definitions follows 4.1" rule is retired.** Resolved 24 Aug in PR #274. It existed to prevent a disclosure that had already happened: `/sample-evaluation`, every real report, and the PDF all publish the full five-band table with both scales, behind a heading that says Show Your Work, with a note that the band runs on the internal /55. Its own justification, that publishing thresholds makes scores auditable, was satisfied weeks ago and nothing bad followed.

**Replaced by a harder constraint. The band cut points are a public commitment: 47, 39, 30, 22.** **4.1 changes what scores criteria earn. It must never change what a given /55 total is called.** Moving 39 to 41 would make an archived report unexplainable to the person holding it. The /55-versus-/10 rounding edge is now disclosed on the page, so it needs no handling inside 4.1.

**Also still open:** the attribution pass (4.4) on the wait screen. The `how-its-scored.html` half shipped with the naming in PR #273, so the hard coupling to the Framework name is discharged.

---

## Decisions the band ladders force

Make these before 4.3 publishes anything.

- **Criterion 8, emotional arc, is attributed to Piper.** Settled 24 Aug and live on `how-its-scored.html`: "John Piper's Expository Exultation: the emotional movement of a sermon is built into the text before it is preached." **Still open:** the `Sermon-coach` slug prints on the report surface, not the marketing page. Fix in `prompt.ts` with the 4.1 bump.
- **Criterion 9, pastoral specificity, is Keller's.** A previous version of this ledger recorded it as having no source anywhere, left unattributed rather than invented. **That was false for weeks.** The live page has attributed it to Keller all along and Keller's source card lists pastoral specificity among his principles. A decision to claim it as Chris's own was nearly taken on the strength of the ledger's account before the page was read. **Keller keeps it.**
- **FCF is filed under Category 2, Structure & Craft.** It is a textual and theological move and one of the three double-weighted criteria. Deliberate taxonomy choice, not an accident to discover after publishing.
- **Criterion id 8 carries a legacy alias**, `Heat Map: emotional delivery`, 4 rows, v3.1 only. Any rename must ship a `normalizeLegacyCriterionNames()` entry in the same commit. Strict on write, alias on read.

---

## Spanish

**Ask 1 sent 19 August. One reviewer, in Spain. Two-week deadline, so roughly 2 September.** Discount conversation was kept separate, correctly.

**Exit criteria still unwritten, and the window is closing.** Write them before the first reply lands, or they become rationalization with a timestamp. Three lines, private: what makes this a build, what makes it a no, and the most likely reason it ends in a no.

**One reviewer is an opinion, not a review**, and it is the opinion of a field partner on a permanent discount who wants this to work. Two more reviewers, same brief, same two-week clock from their own send date, is the minimum where a disagreement means something.

**Open Ezequiel's report.** `ezequiel.caetano@uol.com.br` scored 28, the lowest customer score in the corpus. Read before designing any wider pilot.

**Field-partner discount rule is unwritten.** Working definition: 50% off Coach for the life of the subscription, subscriptions only, never packs or Intensive.

---

## Needs status check

**Imported from the SermonScore ledger, last updated around 6 August. Confirm each against production or the repo, not against a document.**

| Item | What it was | Why it needs checking |
|---|---|---|
| **2.1** Verdict lines backfill | 29 pre-fix rows, run with `--force` or they keep overlong lines permanently | The source ledger says verdict lines merged 5 Aug at `2951b58` and *also* lists them as the next thing to build. |
| **1.3a** `.com` Workspace domain alias | Installs MX, routes chris@sermoncoach.com to the same inbox, free | `.com` is the canonical web domain and still has no MX. The `.com` zone already carries SPF, so Phase 7 is further along than the runbook assumes. Still needs DKIM and DMARC. |
| **2.3** Score display cleanup (5.4) | Cut Tier 5, the formula line, "Simple composite," the category-header sums. Protect the methodology sums. | Highest over-delete risk on the list; name the protected numbers in any brief. |
| **2.4** Small copy fixes | 100 wpm with pace named, circled plus on Mentoring, sample review link, tab-aware subhead, em-dash in Where You Can Grow | Several may have shipped in the July and August passes. |
| **5.16** Quote audit | `cursor-brief-quote-audit.md` written, not started | Fill rate measured at 22%. Fabrication is the failure mode; measure before increasing volume. |
| **3.3** Mentoring sample artifact (5.8a) | Mentor view and mentee view of the same submission, mid-band sermon, fictional mentee | Blocks the circled-plus affordance. An icon leading to a page a pastor cannot buy from is worse than no icon. |
| `.tmp-verify/` in `.gitignore` | That folder held live auth session tokens | `.gitignore` gained three lines in the #247 merge. Probably closed. Verify. |

| FAQ stale copy | "Two of the samples on the homepage are his" | Now one sample eval and one sample sketch, both Hebrews 3:1-6. |
| `output-language.test.ts` coverage | 19 lines of test against 65 lines of new copy | Pins the English heading, lead, close, score order, and the score-5 meaning. Does **not** cover English meanings 4 through 1, Spanish meanings or close, table headers, `MethodologySection` markup, or the HTML page. It proves the spec object was not reworded; it does not prove the table renders. |
| Next.js middleware deprecation | Build warns that the middleware file convention is deprecated in favour of `proxy` | Harmless today, becomes a build failure on a future Next major. Not urgent, but should not be a surprise. |
| `STEP_6_PLAN.md` describes a retired product | Still specifies Cohort at 50 evals a month, pooled | Cohort does not exist; Classroom replaced it. Self-labeled historical, but a plan file describing a dead product is what an agent reads as current. Add a superseded header or delete. |
| Systematic FAQ rename | "rubric" → "Framework" across roughly 12 strings | Open. |
| Category 3 double-weighted question | Ambiguity on `how-its-scored.html` | Open. |

**Deleted from this table on 27 August: item 3.1, mentor seats remainder.** Verified against production in both Step 0 reports. See Open now.

---

## Compounding assets, not yet started

- **Congregational profile as a durable object (9.3A).** Cheapest high-leverage item in the analysis. Converts the one structural advantage from a weekly opt-in into something that compounds. Also the criterion 9 fix.
- **One sample page rendered from a stored evaluation (9.2).** The only structural fix for a shop window that goes stale on its own.
- **`/sketch` is the best organic asset you own and it is still underused.** Free, six questions, no account, no card. The two cheap things are done. Build-on-it work stays parked until the conversion question is answered. **New:** the Sketch should be the front door of the Preaching Lab curriculum, since lay men write for the lab rather than for Sunday and half the value is catching a bad outline on Tuesday.
- **Second cadence beat (5.6).** The Sketch beat midweek alongside the Monday nudge.
- **The Arc (9.3C).** Series-level read, free with Coach, unlocked at four evaluated sermons in one series.
- **Trainer queue for the Preaching Lab.** Eight men submitting in one week is a queue, and there is no view for it. He would open eight separate evaluations from a list. Not a launch blocker at one hand-provisioned lab. One day, and it is the same view a Classroom instructor wants.
- **Annual conversion prompt around evaluation eight**, when the growth chart first has a shape. Lifecycle email, not a build, and it fits the existing send log.

---

## Repo hygiene

**The working tree is dirty and HEAD is not on `main`.** As of 27 Aug, checked out on `experiment/gate-removal-shadow`, which sits at the identical commit to `main` and `origin/main` (`5644083`) with an empty diff. Three untracked files: `scripts/shadow-gate-removal.ts`, `scripts/shadow-ladder-rungs.ts`, and the two Step 0 reports. The shadow scripts are read-only scoring experiments that never write to the database or bump `prompt_version`. Nothing here is lost; it is just not on a branch.

**The "56 unmerged local branches" figure is unreliable and one of its examples was wrong.** `feat/cancellation-state` was listed as unmerged with its migration applied ahead of it, which looked like schema drift. It is merged, at `97037a4` as PR #271. **A squash-merged branch still looks unmerged by ref comparison**, which is how the repo works here, so the count is an artifact of the method rather than a finding. Re-derive against `git log main` before acting on any entry from that audit. `claude/recovered-branches-aug-2026.md` names four and is separately incomplete.

- **`webhook-stripe-activation` was also on that list.** Check it the same way before treating it as stranded.
- **`webhook-stripe-activation` is unmerged**, and the webhook is now load-bearing for seat billing.

Also: `recover/evaluation-ui` is checked out in a **separate worktree**. One stash on `recover/pdf-score-bars`, PDF work, unrelated.

**Every mentor-named branch is already merged into main.** The mentor work is not stranded.

**Dead schema, safe to drop.** `mentor_relationships.period_days` (default 120) and `period_started_at`. `accept_mentor_invite` stamps `period_started_at` on acceptance and **nothing in the database or the application ever reads it back.** `period_days` has never been written to anything but its default. Remains of the original 120-day fixed-term seat model. No constraint, view, policy, or trigger depends on either.

**`recover/live-function-migrations` can probably be archived.** Both files it carried are confirmed live and ledgered.

---

## Domains and legal surface

**Canonical is `sermoncoach.com`, unambiguously.** `site-origin.ts`, `layout.tsx` metadataBase, `sitemap.ts`, `robots.ts`, cookie parent domain `.sermoncoach.com`.

**No Stripe URL hardcodes a domain.** Every `success_url`, `cancel_url`, and portal `return_url` is built from `new URL(request.url).origin` at runtime. **Neither `checkout/route.ts` nor `api/billing/portal/route.ts` calls `preferCanonicalOrigin()`**, even though `src/lib/site-origin.ts` exists to normalise `www.` and both `.online` hosts down to the apex. Its only consumer is the mentor invite carry route.

Practical effect: a checkout begun on `www.` or on `.online` produces a Stripe return URL on that host, which then 308s to apex. It works only because the 308s are in place. Nothing needs migrating for new Stripe objects, because nothing is pinned.

**`.online` survives as the email identity.** Every Resend sender and reply-to, including the mentor invite sender, is `chris@sermoncoach.online`.

Three inconsistencies worth tidying:

- **`privacy.html` and `terms.html` still tell users the service is "accessed through sermoncoach.online"**, on the canonical `.com` site. Belongs in whatever attorney pass eventually happens.
- The same Mentoring seat CTA mails `chris@sermoncoach.com` from `pricing.html` and `chris@sermoncoach.online` from `dashboard/develop/page.tsx`.
- `docs/develop-others-canon.md:184` documents the invite cookie as `.sermoncoach.online`; the code sets `.sermoncoach.com`. The doc is stale.

**Stripe price env var convention:** `STRIPE_PRICE_<FAMILY>_<VARIANT>`. Family is the product line, variant is the **internal domain term**, never the customer-facing name. So `MENTOR_DEBRIEF`, not `MENTOR_APPRENTICE`. Note that **no `STRIPE_PRICE_*` is set in production at all** — Coach and Pack run entirely on hardcoded fallback constants in `checkout.ts` that happen to be real price IDs. `.env.example` documents none of them, which is why the convention was hard to find.

---

## Decided, do not relitigate

| Decision | Call |
|---|---|
| **Coach Pro / $49 tier** | Retired. Growth reporting merges into Coach at $29 this week as a standalone goodwill move, no page rebuild. Nobody was paying $49 for it. |
| **Growth reporting and annual** | Not gated behind annual. Every Coach subscriber gets it, monthly and annual alike. The at-risk users are the monthly ones, so locking retention away from them is backwards, and reporting is what makes a pastor picture himself still doing this in March. A man picturing March converts on his own. |
| **Coach at $39** | When the pricing page rebuilds, alongside Teams and Preaching Lab. Existing twelve grandfathered permanently and told so. Two moves, not one: "new pricing alongside three new products" is a story, "the price went up" is not. |
| **Teams** | Five seats flat, not a 3-to-5 range. Self-serve, $67 and $670. Asymmetric caps: primary 10, four team seats 4 each. Primary seat assigned on a setup screen after checkout, never welded to whoever ran the card. Seat count fixed for the term, no proration. |
| **Team Coaching** | Flat $29 / $290, following the parent term. A team seat has already paid for its evaluations, so the marginal cost of the lead pastor reading them is zero. Per seat it would be $167 against $125 for Classroom, which is the same shape. |
| **Preaching Lab** | **Reversed 29 Aug. Hand-sold configuration, not a fixed product and not a build.** A collection of Apprentice seats: each man reads his coaching debrief, the trainer holds every score. Cohort size, term length, and per-person visibility are all free to vary because seats are per-relationship. **Priced at parts, no discount:** Apprentice $12 per preacher per month, Colleague $25, one invoice to the trainer. The $249 flat price is retired; it discounted parts by 14 percent and went underwater at twelve participants. Tally form collects the roster with a seat type and visibility choice per man. Automate at trainer three. No scores for participants ever remains the defining constraint, enforced by discipline while hand-run. |
| **Lab growth view** | Belongs to the trainer, not the participant. Week twelve, sitting down and showing a young man what moved. A person delivering the evidence, not a dashboard. |
| **Apprentice / Colleague naming** | Already shipped and live on `pricing.html`. Stored `seat_type` stays `debrief` / `evaluation`. Apprentice names the man; Debrief only names the artifact. |
| **Classroom** | Removed from the **homepage** at `9393a9e`, still live on the pricing page at $125/mo minimum. Not retired. Stays hand-provisioned; self-serve waits for institution three. |
| **The Intensive** | $549. Application only. Pattern report across 5 to 10 sermons, one deep evaluation, 60-minute call. Roughly three to four hours of Chris each, so about $140 to $180 an hour. Firmly a calendar product. |
| Packs | Stay personal property. Never team-owned, never pooled. Founding Member 50% never applies. |
| Founding Member and Teams | The 50% does not apply to Teams. Say it in the offer rather than letting someone find it at checkout. |
| Existing Coach subscriber joining a team | Cancels first and gets invited. No proration logic for an edge case that happens twice a year. |
| Seat member leaving a church | Keeps his account at the free tier. His sermons stay his. The seat frees up. |
| **Neutral pronouns, always** | No he, him, his, she, her, hers in any copy about a mentee, a preacher, a mentor, or a pastor. Use the name, "they," or rewrite to avoid the pronoun. This was already true of the invite email and the Colleague accept page, and nine strings drifted from it anyway, because the rule was not written anywhere an agent reads. Swept in `copy/mentoring-neutral-pronouns`, 28 Aug. Note the invite form said "Name the man you're developing," which excluded a woman from the product on the form itself. |
| Melodic line | Descriptive, not scored. Belongs to the book, named as context in criterion 1's narrative and the display block. `claude/melodic-line-v3.5-decision.md`. |
| Big idea | Robinson, criterion 5, passage-level. Distinct from the melodic line. |
| Presumptions | Stated inline inside band definitions, never a separate pre-scoring pass. |
| Presumption overrides | One nullable boolean per criterion row. No reason string in the schema. |
| 3 as the anchor | Present, competent, unremarkable, and the modal score for a faithful weekly sermon. Not reserved for weak sermons. |
| Overreach bar | Deliberately high. A defensible mainstream reading is not overreach. Incidental overstatement presumes 4; load-bearing presumes 3. |
| Audio ingestion | Deferred. Revisit if a test-round pastor cannot submit. |
| "Tier 5" band suffix | Cut from display, keep any internal index. |
| Mentoring nav affordance | Circled plus, not text. |
| Sermon length divisor | 100 words per minute, pace named in the copy. |
| Growth-edge score framing | **Settled 24 Aug, split by band.** Scores 1 through 3 name the movement the fix produces ("To reach a 4, ..."). Score 4 gets the same concreteness with no number and no threshold language. **"To reach a 5" never appears.** Ships in the same `prompt_version` bump as 4.1, because 4.1 moves the 3-to-4 boundary the prose names. Watch for a register break at 4: if the numberless sentence comes back vaguer than the others, the number was doing more work than assumed. |
| Grader model | **Opus, locked 24 Aug.** It writes the narrative prose better and that is the deciding property. The Sonnet-withholds-a-5 finding is real but is a band-ladder problem, not a model property. Do not reopen as a model question. |
| Band cut points | **47, 39, 30, 22, locked.** Published on the sample, on every report, and in the PDF. 4.1 changes what scores criteria earn, never what a given /55 total is called. |
| Community benchmark | Never build it. Ranking a pastor against other pastors is the thing the brand exists not to do. |
| Unlimited evaluations | Never match it. Argue the cap on coaching grounds. **Not a cost problem:** at roughly $0.42 to $0.50 a run, unlimited breaks even around 38 to 40 evaluations a month and a pastor preaching four times never approaches it. It is a positioning weapon, and the answer is the coaching argument rather than a price match. |
| Per-criterion band definitions stay unpublished | **Deliberate, and an accepted asymmetry rather than a competitive gap.** SermonScore publishes all fifty-six of his calibration statements inside the product. The Sermon Coach publishes the general five-rung ladder (PR #281) and the composite band table (PR #274), and withholds the eleven per-criterion rung sets. Selection and arrangement are hard to copy because they encode judgment; per-criterion rungs are paste-able text and are the most copyable thing in the instrument. **Do not reopen this as a transparency deficiency.** Caveat: unpublished rubric text is protected as a trade secret only if it is actually treated as one, which is a question for counsel alongside the ™ and the authorship paragraph. |
| Proprietary framework naming | **Reversed 23 Aug and shipped 24 Aug in PR #273.** The old "never" was protecting provenance, which was right, but it treated naming the instrument and claiming the ideas as the same act. Naming the instrument narrows the claim to the part that is original: eleven criteria rather than ten or twelve, three double-weighted, four categories, a 55-point composite. |
| Framework, canonical name | **The Sermon Coach Expositional Framework.** Live in the H1 and title of `how-its-scored.html`. Expositional, never expository. Definite article included. ™ only, never ®. **Standard was the original choice and was dropped because SermonScore.ai already uses "the Standard,"** so the one word meant to establish originality would have read as convergence. **Not attorney-reviewed:** the ™, the authorship paragraph, and "my own work" go to counsel with terms and privacy. |
| Peer read model for church teams | Never build it. Pastors are private about sermons in a way students are not. Note this is **not** what Team Coaching is: there the lead pastor reads down, and only on each man's accepted invitation. Peers still never read each other. |
| GTN giving claim | Fully removed on legal advice, August 2026. Do not reintroduce in any form: not "net profits," not "proceeds," not percentages, not fixed amounts. Biographical GTN references are fine. |
| SEO posture | Hygiene only, and the hygiene is done. No keyword targeting. |
| `/start` crawlability | Keep it crawlable. Excluded from the sitemap, never disallowed in robots. |
| `.online` registration | Keep it registered and redirecting permanently. Change of Address window runs to roughly 17 Feb 2027. |

---

## Parked, with triggers

- **Name-first checkout.** Parked 28 Aug. The idea is sound: a pastor names the man before he pays, so a paid seat is never provisioned with nobody waiting to fill it. The answers ride through Stripe session metadata, the webhook creates the invite row, and the pastor presses Send.

  Three reasons it is parked rather than next. Its Step 0 has a real unknown: `create_mentor_invite` reads `auth.uid()` and the webhook has no session, the same blocker the cancel work hit, and this one is an insert that has to respect capacity rather than an update to an existing row. It puts a third party's email into Stripe as a business record for the first time, and privacy is not attorney-reviewed. And the invite screen already asks for a tier and a visibility choice; adding a name and an email makes four questions before payment, which may convert worse rather than better.

  **The real reason: nobody has ever completed the current flow.** Zero real mentees have accepted an invite in production. Building a better funnel before watching one real pastor use the existing one is optimizing against a theory. **Unpark trigger:** one real pastor completes an invite, or one reports abandoning it partway.

- **Self-serve Classroom.** Waits for institution three. Hand-provisioning twenty seats is an afternoon once a term, which is the correct implementation at one or two schools. Cohort view only if a pilot asks (2 to 3 days); release gate only if the pilot is a graded course.
- **Term-total submission counter for the Lab.** Only if a trainer reports his men hitting the wall in week three. The 2-per-month cap is the shipped model.
- **Pooling.** Written into the Classroom spec, never built, and no institution has ever been provisioned. Do not build until one needs it.
- **Audio ingestion.** Revisit if a test-round pastor cannot get a sermon in.
- **Passage read (9.3B).** After the passage-inventory work.
- **Archive read and tendency profiles (9.3E).** After the Intensive boundary is drawn on the pricing page.
- **Per-post OG images.** `next/og` `ImageResponse` needs the font as an `ArrayBuffer` at the edge, and Charter is not fetchable from Google Fonts. Revisit only if blog sharing becomes a real channel.
- **`http://sermoncoach.com/index.php`** appears as a referring page in Search Console. No PHP anywhere in this stack, almost certainly a spam link at a URL that never existed. Blocks nothing.
- **GTN partner codes.** Gated behind attorney review, related-party issue. Build trigger roughly 15 to 20 manual comps.
- **Blog automation.** Fully manual today. Do not build without a scoping conversation.
- **`sermonrefinery.com`.** Open keep-or-cancel decision. Not a brand candidate.

---

## Recently closed

**Restored from the other fork: six PRs the 29 August version had lost.** #270, #272, #273, #274, #283 and #284 are recorded below. Two entries carry unresolved conflicts and are marked.

**Coach was being revoked on the first failed invoice, and it is fixed.** 24 Aug, **PR #270** at `16e4522`. Two paths both wrote `inactive` the moment a payment failed while Stripe was still retrying for up to 14 days: `invoice.payment_failed` called `deactivateProfile` directly, and `customer.subscription.updated` deactivated on any status outside `active` and `trialing`, which includes `past_due`. A card expiring on Tuesday took Coach away on Tuesday, Stripe often recovered later that week, and with every customer email toggle off the subscriber was told nothing. **Removing only the `invoice.payment_failed` write would have fixed nothing**, because Stripe sets `past_due` at the same moment it fires the failed invoice. The fix adds `GRACE_STATUSES` containing `past_due` and makes the branch three-way: activate, grace (write nothing, log), deactivate. **What bounds the window is a Stripe setting, not code:** Revenue recovery is set to cancel the subscription after retries are exhausted, which fires `customer.subscription.deleted` into the handler that already deactivates. Had it been "leave past due," this fix would have granted Coach forever on a dead card. **Check that setting before ever widening `GRACE_STATUSES`.** Verified by test coverage on all seven status cases, not by a live event; the CLI route was declined because `stripe trigger` fires against the authorized account and its fabricated customer takes the skip path before reaching the logic under test.

**Stripe billing configuration hardened.** 24 Aug, dashboard only. Customer emails turned on for expiring cards, card payment failures, and upcoming renewals; all five toggles had been off, so the grace window above would have passed in silence. The payment-method update link was moved off four legacy `sermoncoach.online` URLs to one custom link on `.com`. Subscription management turned on, pointed at the Stripe customer portal, **which displays the privacy policy and terms from Account settings, so two unreviewed documents are now shown inside a payment flow.** Cancellation survey confirmed already on.

**Cancellation state and tenure columns.** 24 Aug, **PR #271 merged at `97037a4`**, confirmed by `git log main`. The 29 August repo-hygiene audit that called `feat/cancellation-state` unmerged was wrong: it read the branch rather than the history, and the work reached `main` through the squash-merge commit. **The audit's broader claim that 56 local branches are unmerged should be re-read with that in mind**, since a squash-merged branch still looks unmerged by ref comparison. The migration is applied, recorded, and repaired, adding `subscription_started_at`, `canceled_at`, `cancellation_effective_at`, `cancellation_source` with a three-value check, `cancellation_reason`, `cancellation_comment`, `is_comped`, and `comp_reason` to `profiles`. Two timestamps rather than one because a cancel on day 3 of a cycle runs 27 more days, and one stamp cannot tell a month-four decision from a month-five ending. `subscription_status` was deliberately not widened. **The backfill was cut and its script deleted:** its only dry run pointed at a test key and returned zero qualifying rows, and an unverified write to cancellation dates has no undo and does not error when wrong.

**Newsletter band unified across eight surfaces.** 24 Aug, **PR #272**, verified by curl on nine URLs. `/pricing`, `/faq`, `/how-its-scored`, `/story`, `/why-sermon-coach.html`, `/blog`, `/terms` and `/privacy` all carry the dark band; `/` keeps the light variant deliberately because the dark one would break its alternating background. **Step 0 changed what the task was:** four of the five pages already carried a band in a light variant, so inserting as briefed would have stacked two signup forms on four pages. Per-page `data-newsletter-source` values were preserved, which was the quiet risk; copying the blog markup wholesale would have set every page to `blog_index` and destroyed per-page attribution.

**The rubric is named, and the attribution page is corrected.** 24 Aug, **PR #273**, single file. The Framework name is in the H1 and title of `how-its-scored.html`, with the old headline surviving as a subtitle. The authorship paragraph published verbatim: *The convictions are not mine. The instrument is. Eleven questions rather than ten or twelve, three of them weighted double, sorted into four categories and scored to a composite of 55. That selection, that weighting, and that arrangement are my own work.* **Three defects were found by reading the live page rather than reasoning from the ledger:** criterion 9 was already attributed to Keller, criterion 8 already to Piper, and question 3 contradicted a locked decision in its own text by opening "Piper's standard for gospel clarity" then attributing the same question to Bullmore two sentences later. Six of eleven detail blocks said the same thing twice, in the shape of an attribution pass that appended without removing.

**The Grading Bands table is derived, not typed, and one published number was wrong.** 24 Aug, **PR #274**. The table was hand-typed in both columns while the sermon's own score in the same panel was computed live. **Needs Improvement published 4.0–5.3 as 4.0–5.4**; 29 ÷ 5.5 rounds to 5.3, and "5.3" appeared nowhere in `src/`, which is the tell that no computation produced those strings. **This was on the paid product, not just the sample**, since one component serves the sample page, every real report, and the PDF. The fix derives: `SCORE_BAND_DEFINITIONS` and `WEIGHTED_SCORE_MAX` extracted as the single source of truth, all three derive functions pointed at it, and a test asserts the display column equals `toDisplayScore` on the endpoints. The three derive functions were verified against `main` before extraction and used identical cut points, so nothing was silently harmonized.

**The shadow harness was deleted, then restored, then hard-capped. It is present on `main` today.** The full sequence, from `git log`: `631d155` created it, `11bff41` removed it as **PR #284**, `2989de2` reverted that merge, and `2b865ba` added the ceilings. Two forks each recorded one end of this and neither knew the reversal happened.

**The decision that stands is the last one: keep the harness, cap it in code.** `COST_ABORT_USD = 6` and `MAX_API_CALLS = 12` as module constants, checked after the estimate prints and before the Anthropic client is constructed, so an abort cannot leak a partial spend. `--force` was removed rather than gated, because an override that exists gets used at 11pm. The 12-call cap is deliberately tighter than a real run, so raising it requires an edit rather than a flag. Verified with a negative test: a 20-sermon selection planning 40 calls aborted with no `Running sermon` lines.

**Why deletion was proposed and why keeping it is better.** Four unplanned 36-run sets cost roughly $45 in one evening because the abort had an override and the halt lived only in a conversation. Deleting removes the tool; capping removes the failure mode and keeps the tool. The rule either way: **any script that calls a paid API gets a hard cap with no bypass, or it does not sit on `main`.**

**Nine paying subscribers, four comped, plus Chris's own account.** Established by hand 24 Aug, not by query. **Paying:** Jon Demeter, Tyler James, Johnny Martinez, Nathan at emmanuelpa (annual, $290), Joe at encounternatomas, Matt Robards, David at operationspain, W. Lentz, Stephen at dwellcitychurch. **Comped permanently:** Steven Anderson, Greg Hodson, Malachi Tresler, Paul Madson. **The twelve-subscriber figure this ledger carried was wrong** and every derived number inherited it; conversion is nine paid against ~125 profiles, roughly 7 percent rather than 10.

**Two shapes of comp exist and they are not equivalent.** Malachi Tresler and Paul Madson run $0 Stripe subscriptions, visible in Stripe and counting as active in every Stripe view, which is what made the base look like eleven. Steven Anderson and Greg Hodson have no Stripe object at all and surfaced only as a count mismatch. **Prefer the $0 subscription for any future comp.** `is_comped` is set on Steven Anderson, Greg Hodson and Paul Madson; **Chris's own account is deliberately unflagged**, so any retention query excluding `is_comped` must also exclude `381edea4-dd32-41b4-9616-8da065e1d0d2`. Malachi joins when he has an account: he is Chris's pastor, comped free forever, on sabbatical, and has no profile yet.

**An earlier pass identified the comped accounts by joining on email and got one of four wrong.** `dwellcitychurch@gmail.com` is Stephen and pays; `lanceron12@hotmail.com` is Steven Anderson and does not. Stripe and `profiles` also disagreed on two addresses outright. **The roster above came from Chris naming people, not from a join.**

**Team account vocabulary, 29 Aug.** `profiles.is_team_account`, boolean, default false, set by hand when a team is provisioned. When true, the Mentoring surfaces speak Teams: rail item **Team**, eyebrow **Your team**, h1 *"Read what your team is preaching."*, lede *"Everyone on staff who preaches gets their own account and their own library. You see every evaluation."*, the seat label drops from the card header, the invite trigger becomes **Add a preacher**, the end action becomes **Remove from team**, and the Your Seats block hides entirely.

Your Seats hides rather than relabels because a team pastor did not buy seats, he bought Teams. Add a seat would send him to a checkout granting a Colleague seat outside his team.

The flag is on `profiles`, not `mentor_relationships`. A pastor running Teams **and** mentoring someone outside his staff would need it per relationship. Nobody does yet, and the migration later is straightforward.

**Verified by flipping the flag on and back off in production.** The flip-back is the check that matters; it proves the other 135 accounts are unaffected.

Consequence worth knowing: a Teams pastor has no in-app way to add a preacher, because the invite flow needs an available seat and his were provisioned by hand. He emails Chris. That is the intended behaviour for a hand-provisioned product.

**Pricing page rebuilt, 29 Aug.** An orientation block above the cards routes by goal rather than price, with each product name jumping to its card. Coach before Pack. Three groups: for your own preaching, for developing preachers, for churches and institutions. Hairline rule under each group header, one gold left rule down the block, borrowing `.frame`'s values without its class so it does not inherit the tint.

Two blocks deleted. The subscriptions-versus-packs paragraph, whose last line moved to the Pack card as *"The same rubric and the same evaluation. You just buy them as you need them."* And **"Why the plan has a limit"** in full, which argued against unlimited plans and was defensive posture about a competitor rather than a statement about the product.

Card titles now swap with the toggle: **Apprentice** and **Colleague**, not "Mentoring". Section headers are **Develop Others** and **Churches and Institutions**, in Title Case. **That is a deliberate pricing-page exception to the sitewide sentence-case rule**, taken knowingly, and it must not propagate.

Note the vocabulary split: the pricing page says Develop Others with Apprentice and Colleague cards, while the app rail says Mentoring. Same product, different words, and that is currently on purpose.

**Mentee visibility: the dark Apprentice option. Live and verified, 28 Aug. PR #293.** A mentor now chooses at invite time what the man he is developing sees: the coaching debrief, or nothing at all. This is the answer to the only real user signal in this lane. Tyler James withdrew his one invite because he did not want an AI product sending his guy anything directly; he wanted to be the moderator.

Visibility is two axes, not one enum: does the mentee get the debrief, and when does he get the score. Colleague is debrief plus score now. Apprentice is debrief plus score on release. Preaching Lab will be debrief plus score never. Dark is neither. Same $12 seat, same two submissions a month, no new seat type and no new Stripe price. Asked at invite time, not checkout, because a mentor is thinking about one specific man at that moment.

`mentee_reads` is nullable text on `mentor_relationships`. **`'debrief'` is stored as NULL and only `'none'` is ever written.** That is what makes the new default byte-identical to the 28 existing rows, and it is the property that stops someone later backfilling `'debrief'` into the NULLs. If the column is read anywhere new, NULL and `'debrief'` must mean the same thing.

**One item was cut at Step 0 and the reasoning matters.** The dark path could skip the debrief insert and cost $0.42 instead of $0.92. But `claim_mentored_evaluation`, `complete_mentored_evaluation`, `fail_mentored_evaluation`, and `processMentoredEvaluationJob` all assume the diagnostic and debrief rows exist as a pair. Rewriting four functions to save fifty cents on a submission type nobody has bought is a bad trade. Both inserts stay.

**The submit poller turned the handoff screen from optional into required.** `SermonForm` polls `debriefEvaluationId`. Closing RLS without changing submit would leave a dark mentee waiting on a page returning 404. So the handoff shipped in the same commit as the read block, and a dark relationship can never exist without it.

Handoff copy, verbatim: *"Your sermon went to {mentor}. You'll hear from them about it."* Two sentences, nothing else. The product does not speak to him; everything reaches him through his pastor.

**Release is hidden on dark relationships. PR #294.** The RLS blocks a dark mentee's read even after `released_to_mentee_at` is set, which was deliberate. So Release wrote a stamp nobody could act on: no error, no effect, and write-once so the mentor could not retry. Hidden, not disabled. The line above it now reads *"This evaluation is for you. Nothing here reaches them; you deliver it in person."*

**A mentor can open a dark seat, forward only. PR #295.** `debrief_visible_since`, nullable timestamptz. The flip sets `mentee_reads` to NULL and stamps `now()`. The gate hides when the seat is still `'none'`, or when the stamp is set and the evaluation's `created_at` is before it. Sermons already submitted stay dark; a mentor flipping the switch does not retroactively hand over three months of coaching he had been delivering in person.

**Forward-only lives in three places, not two.** The policy, the mentee view (`getMenteeCoachingView` keyed off the live column and would have rendered old sermons empty rather than as a handoff, which is a silent failure), and the preacher card, which is per-sermon: a card-level check would have put Release back on sermons the mentee still cannot read.

Verified in production across all three surfaces. Tara's card shows Hebrews 3 with the original paragraph and Release, and House That God Built with the dark line and no Release, on the same card.

**One direction only.** Darkening a man who has been reading his coaching is a different and worse conversation, and nobody has asked for it.

**Seat-end email to the mentee. Live and verified in production, 28 Aug.** PRs #291 and #292. When a relationship ends on either path, the mentee is told his seat closed, his library survived, and what a plan of his own costs. This is the only mechanism that will ever test whether seats acquire anyone, and it did not exist.

Step 0 confirmed the library promise is true: `sermon_evaluations_select_own` never checks relationship status, so released debriefs and all debrief-mode rows survive the end. Unreleased Apprentice diagnostics stay hidden, which matches the copy.

**One line was cut at Step 0 and the reasoning is worth keeping.** The draft said "your first one after this is on us." Granting a free evaluation at seat end is not trivial: clients cannot write `profiles`, a mentee who still holds his signup free eval would get two, a mentee already on Coach does not need one, `eval_credit_grants` still has `stripe_payment_id NOT NULL UNIQUE`, and a double-fired webhook would double-grant with no stamp to stop it. The line came out rather than the promise being false.

Sender is `sermoncoach@sermoncoach.online` with reply-to `chris@sermoncoach.online`. Resend authenticates the domain, not the mailbox, so no new account was needed. Reply-to matters because `sermoncoach@` has no inbox behind it. **This is the first send from that mailbox.**

Idempotency is `mentor_relationships.seat_end_email_sent_at`, migration `20260828163000`, applied by hand and repaired. Same stamp pattern as `invite_email_sent_at`. No `lifecycle_sends` table exists and one was deliberately not invented for a single email.

The copy is path-neutral on purpose. "Everything he released to you" means all of it on the manual end path, where the RPC releases, and whatever was already handed over on the billing path, where nothing releases. Do not let anyone improve it into something path-specific.

**Verified end to end.** Relationship ended at 17:40:45.066, stamp wrote at 17:40:45.62, Vercel logged `rpc ok, notifying` then `sent`, and the email landed in the inbox rather than spam. Subject, sender, reply-to, and the Keep going link all correct.

**The first attempt failed and the reason is a standing hazard.** `PreacherList` is a client component, and the tab predated the deploy, so the browser ran the old JS that called `end_mentor_relationship` directly. The row ended, Vercel was never touched, notify was never called, the stamp stayed null, and nothing logged. Three observations, one cause. Path 1 now runs through a server action so future changes are protected, but a change to a client-called path can never protect its own rollout.

**One row is deliberately left orphaned.** Relationship `56d72d55-7c3b-4b61-8b31-da0447e0c32c`, ended 17:03:52, `seat_end_email_sent_at` NULL. Test account, nobody waiting, mechanism proven. Not worth the retry. If a null stamp ever turns up in a query, this is the one.

**Seat cancel now ends the relationship, PR #285. Verified in production 27 Aug.** The webhook closes oldest active relationships after revoking excess pending invites, using the same service-role write path so revoke can never be skipped.

Step 0 surfaced two things that reshaped the build. `end_mentor_relationship` depends on `auth.uid()` and cannot be called from a webhook with no session. It also **releases every held evaluation**, which meant the End mentoring button in `ActiveMenteesList.tsx` had been silently handing mentees everything held, with no warning. That is defensible for a deliberate manual end and wrong for a billing event that could be an expired card.

**The rule, now settled: manual end releases, seat cancel does not.** The webhook writes `status = 'ended'` and `ended_at` directly and never touches `sermon_evaluations`. A comment sits at the write telling future readers not to bring it to parity with the RPC. The End mentoring button now warns before it fires.

Live test, two active Apprentice relationships with capacity dropping from 2 to 1:
- The older relationship (5 Aug) ended. The newer one stayed active. Oldest-first ordering correct.
- Both held diagnostics on the ended relationship still read `released_to_mentee_at` null. The one previously released row kept its original timestamp.
- `comp_debrief_seats` unchanged at 1 through purchase and cancel. Comp and purchased stack rather than clobber.
- Exactly two fields changed per row: status and `ended_at`.

**Four stale customer-facing claims corrected.** 27 Aug, PR #282 (`5bb517d`) and the pooling remainder branch. The Classroom card no longer promises credits pooled across the class, in any of the four places it appeared: `pricing.html`, `faq.html`, `dashboard/develop/page.tsx`, and the dormant `HomeV2Institutions.tsx`. Pooling was never built and the shipped model is a per-seat monthly cap. The Intensive scope was corrected from three to five sermons to five to ten, on the pricing page, in the Tally application form, and in the acceptance email. Verified on production: `pooled across` returns 0, `Five to ten` returns 1, `faq.html | grep pooled` returns 0.

Left deliberately: "allotment" as a per-person monthly cap in `faq.html` and `terms.html` is accurate copy, the mentoring allotment code is a different thing, and `allotment_exhausted` is an error code that should never be renamed for prose reasons.

**Mentor seat billing is live and verified on production.** 27 Aug. Two Stripe prices created by hand, `STRIPE_PRICE_MENTOR_DEBRIEF` = the $12 Apprentice price and `STRIPE_PRICE_MENTOR_EVALUATION` = the $25 Colleague price, both set as **Config, not Secret**, Production only. Full round trip proven: Colleague purchased with a real card, webhook fired, `purchased_evaluation_seats` went to 1, panel read `0 of 1`. Subscription cancelled and refunded, capacity returned to `0 of 0`. **`comp_debrief_seats` was untouched throughout**, which was the one interaction that could have silently broken the ten comped pastors, since `setPurchasedMentorSeats` writes an absolute value rather than a delta. Seats are purchasable for the first time.

**Hard cost ceilings on the shadow scripts.** 27 Aug, after four unplanned 36-run sets cost roughly $45 in one evening. `shadow-gate-removal.ts` now carries `COST_ABORT_USD = 6` and `MAX_API_CALLS = 12` as module constants, checked after the estimate prints and **before** the Anthropic client is constructed, so an abort cannot leak a partial spend. `--force` was removed rather than gated, because an override that exists gets used at 11pm. Cost abort exits 2, unknown flag exits 1. Verified with a negative test: a 20-sermon selection planning 40 calls aborted with no `Running sermon` lines. The 12-call cap is deliberately tighter than a real run, so raising it requires an explicit edit rather than a hurried flag.

**Score scale copy shipped, PR #281.** 27 Aug, `main` at `38c10e8`. The 1-to-5 criterion scale now has a heading, lead, five criterion rungs, and a close on `how-its-scored.html` and in `MethodologySection`. Pre-merge review confirmed the delta is display-only.

**`src/lib/evaluation/output-language.ts` is a mixed file, and that is a standing hazard.** It exports three Spanish prompt fragments that `prompt.ts`, `hip-prompt.ts`, and `verdict-line-prompt.ts` concatenate into messages sent to Anthropic, alongside display copy that never reaches the model. PR #281 touched only display keys, so no `prompt_version` bump was owed. But anyone told to "fix the copy in output-language.ts," including an agent, could edit a prompt constant and call it copy. **Split the prompt fragments into their own module before the Spanish work resumes**, since that is exactly when someone will be in there editing both.

**The mentoring dashboard is built and populated.** 27 Aug. Seat capacity panel, pending invitations with copy-link and revoke, People you are developing with submission counts, and a Submissions list showing the held score with a Release the score control. The held-state copy already reads *"Held. The coaching debrief and How It Preaches are already shared."* This is most of what item 3.3 was asking for.

**`MENTORING_UI_ALLOWLIST` holds only Chris.** 27 Aug, read from the Vercel dashboard. The Step 0B finding that the single allowlisted id was not his came from a stale local `.env.vercel.prod` pull. Nothing in the mentoring lane is visible to any real user.

**Mentor seat production state is verified.** 27 Aug. Two read-only passes, no writes, no migrations. The entitlement engine is finished and correct. A complete checkout route already exists. Cancel capacity accounting works. Seat-first credit consumption works. `period_days` and `period_started_at` are confirmed dead. Full evidence in the two Step 0 reports; the open remainder is in Open now.

**The `auth.getUser()` prewarm is intact.** 27 Aug. Commit `6fc3f91` confirmed an ancestor of `main`, and the prewarm is present in `dashboard/layout.tsx` at lines 28 to 31, ahead of any child render, with the rationale preserved in the comment block. Working tree matches main byte-for-byte. This was the highest-risk unverified item on the board.

**Local `main` matches `origin/main` exactly.** 27 Aug, after a fetch. Zero ahead, zero behind.

**SEO Tier 1 is closed.** 21 Aug. Full record in `claude/spec-tier1-search-visibility.md`. This was the floor, not a channel.

- The indexable Vercel alias is dead. `sermon-coach-site.vercel.app` now returns `HTTP/2 308 → https://sermoncoach.com/`.
- App Router `sitemap.ts` and `robots.ts` shipped. `public/sitemap.xml` and `public/robots.txt` deleted in the same commit, which was mandatory.
- Canonicals site-wide, and nav/footer home links moved off `/index.html`.
- OG and Twitter cards on `/sketch` and every blog post, plus `Article` JSON-LD.
- Search Console done. Both domains verified as Domain properties via DNS TXT. Change of Address filed, 180-day window to roughly 17 Feb 2027.
- Production verification, all three fingerprints matched.
- Bing Webmaster Tools added and sitemap submitted. Presence play only; the dashboard will show zeros indefinitely and that is the expected outcome.

**Leaked password protection is on.** 19 Aug.

**The null `evaluations_period_start` bug has never fired.** 19 Aug. Zero profiles across all 125.

**Migration ledger drift is resolved.** 19 Aug. All three local-only migrations verified present in the remote schema, then marked applied.

**The trap that was avoided.** `supabase db push` applies pending migrations in version order but executes them *now*. `20260730180000` carries an older version number than the migration that superseded it, so a push would have run it today and overwritten two live credit functions with a three-week-old body. `create or replace` gives no warning.

**Turnstile is working correctly.** 19 Aug. No visible widget in Managed mode for a low-risk visitor is expected behavior.

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
- **Do not let load-bearing work live only in a chat thread.** The band ladders sat in one until 12 August, and two weeks of this ledger were built on a picture the ladders file had already corrected.
- **When two files can both return 200, a status check proves nothing.** Pick a greppable string that exists in exactly one of them.
- **A file in `public/` silently shadows a same-named App Router route.** No warning, no build error.
- **A Search Console Domain property needs the full sitemap URL**, not a bare path.
- **The two domains live at different registrars. Run `dig +short NS <domain>` before touching any DNS record.** Both registrars auto-append the domain to the Name field, so a host entry must be `@` or the bare token.
- **Ask DNS, not the registrar UI.** `dig +short CNAME <host>.<domain>` answers in one second what paging through twenty registrar rows answers in five minutes.
- **A grep of one file is not a grep of the code path.** Step 0 concluded the Stripe webhook never touches `mentor_relationships` because `stripe-webhook.ts` contains no such reference. The write is one import away, in `mentor-seat-revoke-pending.ts`. Trace imports, not filenames.
- **A STOP condition that fires on a placeholder blocks the questions that mattered.** The C1 stop in the first mentor diagnosis existed to prevent duplicate Stripe objects. No Stripe object existed, and the stop cost four answers. Scope a stop to the actual risk, not to a string match.
- **Ask who a row belongs to before treating it as a signal.** Twenty-four mentor relationships and a stranded mentee looked like a live problem for a real pastor. Every accepted relationship belonged to a `cdaukas+` test address, and the unaccepted invites were the residue of a pause Chris announced on purpose.
- **A written promise on a live page is a commitment whether or not code honours it.** Twelve seat promises on `pricing.html`; six have no code and one is inverted. Audit copy against behaviour before the first customer, not after.
- **An experiment that cannot move cannot tell you anything.** Four shadow sets reported criterion 1 completely invariant across both arms. The six pinned sermons had all already scored 4 or 5 in production, so there was no room below them to move into. Roughly $45 for a property of the sample. Before running anything, ask what range the corpus covers and whether the effect you are testing for could even appear in it.
- **A client component calling an RPC directly has a stale-tab window on every deploy.** The seat-end email's first production run failed with three symptoms at once: row ended, stamp null, zero log lines. The cause was one thing. `PreacherList` is a client component and the tab predated the deploy, so the browser ran old JS that called `end_mentor_relationship` against Supabase and never touched Vercel. Path 1 now runs through a server action, but a change to a client-called path can never protect its own rollout. Hard refresh before testing anything that just deployed.
- **Silent success and a silent failure mode are indistinguishable.** Before the logging pass, a seat-end email that sent logged nothing and one skip path also logged nothing, so the only observable difference was a database stamp with no monitoring behind it. Every exit should log, including success, on anything that fires a few times a month and nobody watches.
- **Ask what a word means before sizing the work.** A Step 0 was written for "Teams" and came back at 12 to 16 days, because it sized an automated product with its own tables. Teams as actually sold is Coach plus Colleague seats, hand-provisioned, zero build. The estimate was right and the question was wrong. When a product name has two meanings in the same repo, say which one before asking anyone to scope it.
- **Pull the whole distribution before diagnosing part of it.** A day went into two criteria that concentrate at the top, treating that as the rubric's problem. The eleven-criterion table, one query, showed healthy spread on seven or eight of them. The instrument was working; the sample of criteria being looked at was not representative of it.
- **A skewed distribution is not evidence of a broken instrument.** Before asking why the instrument is wrong, ask whether the population explains the reading. A Chapell-derived rubric applied to preachers who read Chapell will find them doing the redemptive arc well.
- **A cheap null is worth more than an expensive assumption.** Two shadow runs killed the two leading explanations for the 4-versus-5 concentration before 215 lines of prompt text were written against either.
- **Do not identify people by joining on email.** Two accounts in the same twelve were Stephen and Steven, one paying and one comped, and an email match assigned the wrong one. At this size the roster comes from Chris naming people; a join is a hypothesis to check against that.
- **"Active" is not "paying," and the dashboard will not tell you.** Stripe listed 11 active subscriptions; two invoice at $0 and two more comped accounts had no Stripe object at all. A count taken from a status column, in either system, counts entitlement rather than revenue.
- **"Add X to these pages" assumes X is absent from them.** The newsletter band looked like a five-page insert. Four already had one, and inserting as briefed would have stacked two signup forms on four pages.
- **A dashboard setting can be the load-bearing half of a code fix.** The payment grace change was only safe because Stripe cancels subscriptions after retries are exhausted. When a fix hands control to a third party, read that party's configuration before merging.
- **A synthetic event cannot verify a handler that resolves a real row.** `stripe trigger` fires against the authorized account and its fabricated customer takes the skip path before reaching the logic under test. Two failure modes at once: it risks writing junk into the live account and proves nothing when it works.
- **The alias protects the app path and nothing else.** `normalizeLegacyCriterionNames()` runs inside parse and is invisible to any query written in the SQL editor. Every direct jsonb query either applies the alias itself or groups on criterion id.
- **A script that spends money needs a ceiling in the script, not an agreement in the chat.** Two 36-run sets executed after the decision to stop, roughly $30. The abort had a `--force` override and the halt lived only in a conversation.
- **Stratify the sample on the variable under test, not on a summary of it.** A sample chosen for comparability with a previous run is not automatically a sample that can answer the new question.
- **Two parallel sessions will both rewrite this file and neither will know.** It has now happened twice: 23 August and again this week, each producing a complete ledger missing half the work. One session owns the file; every other session returns notes to fold in.
- **A squash-merged branch looks unmerged by ref comparison.** An audit reported 56 unmerged local branches and flagged `feat/cancellation-state` as unmerged with its migration already applied, which read as schema drift. It was merged at `97037a4`. Ask `git log main` what arrived, not `git branch --no-merged` what still points somewhere.
- **Two documents can each be right about half a sequence.** One fork recorded the shadow harness deleted, the other recorded ceilings added to that same file days later. Both were accurate; neither knew a revert sat between them. When two records conflict on whether something exists, read the file's own commit history rather than picking a winner.
- **A competitive analysis outlives the competitor.** The SermonScore review is filed as a competitive artifact, but its most valuable findings were quality defects in this product: two criteria contradicting each other on one phrase, a growth-edge pattern that gave three of eleven criteria nothing to say, and a 5 awarded on a criterion with a load-bearing omission. Re-read it for what it says about the instrument, not about the rival.
- **A product can be fully decided and still have no build item.** The Preaching Lab was specified in Decided, pitched in Distribution, and priced in the product table, and appeared thirteen times in this ledger without anyone writing down what had to be built. A decision recorded in three places reads as progress. Ask what the work is, not whether the choice was made.
- **A merge loses things quietly, and the loss looks like completeness.** Merging two forks restored seven PRs and a week of decisions, and still dropped two open items: the sitewide gold AA failure and the extensionless `/why-sermon-coach` 404. Neither was contradicted by the other fork; both simply were not in the base. **After any merge of this file, grep the version being replaced for its own section headings and check each one landed.** A merged document reads as authoritative precisely when it is least verified.
- **Ask whether the product is a build or a configuration before sizing it.** The Preaching Lab was estimated at 14 to 22 days as a self-serve product with its own tables. It is a collection of Apprentice seats with a term and an invoice, and every mechanism it needs already shipped. The same reversal happened with Teams, which was sized at 12 to 16 days and is sold today hand-provisioned with zero build. **Twice now, a Step 0 answered correctly and the question was wrong.**
- **A fixed spec invents constraints that no customer asked for.** Eight people, twelve weeks, one visibility setting. None of those came from a trainer, and a four-man cohort over eight weeks would have been refused by the product. Hand-selling first surfaces the real distribution of what people want, which is the spec for whatever automates later.
- Verify against the thing, not against the account of the thing. Failures so far: a migration history table that lied, a repo doc read as production config, a competitor's surface read as his depth, a sermon's account of its own passage read as the passage, an invisible Turnstile widget read as a broken one, this ledger's own inflation-check framing retired 12 August and carried forward anyway, a fetch tool's 404 read as production state, and a single-file grep read as a code-path audit.
