# The Sermon Coach: working ledger

**This is the one living document. Overwrite it. Do not date it, do not fork it.**

Supersedes `claude/state-of-play.md` and the Status ledger section inside `sermonscore-competitive-analysis.md`. That competitive analysis stays as the research artifact it is; its ledger has been lifted out and merged here.

Last updated 4 September 2026.

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

**Resolved 30 August, and it was never one question.** It is two products.

**A seat is for a man who submits his own work.** That is what a seat is for, and it is not negotiable at purchase. A cohort where the trainer submits everything produces one user and eight passengers: no accounts, no libraries, nobody who knows how the product works when the term ends. **Each man submitting is the acquisition mechanism**, and the seat-end email is already doing that work. A form question offering the alternative would have let a buyer opt out of it.

**A pastor who wants to run someone else's sermon himself uses his own credits.** He has ten a month and needs no permission. That is exactly what Tyler did. No branch, no case-by-case, no arrangement to negotiate.

**Consequence: the preacher-name field moves up, not down.** Running another man's sermon on your own credits is now the sanctioned path rather than a workaround someone improvised. See the next entry.

### Preacher-name field, to retire the growth exclusion flag

**Reclassified 30 August: this is no longer a workaround to accommodate, it is the supported path.** A pastor who wants to evaluate another man's sermon himself uses his own credits, decided the same day. So the gap below is not an edge case left over from one user, it is a hole in a use the product endorses.

Tyler's submission created a real problem, and the exclusion flag patched the symptom. The disease is that another man's sermon sits in Tyler's library indistinguishable from his own except by a title he typed.

That cost compounds. Every future feature has to remember the flag: growth, history, search, PDF, streaks, the Monday digest. One forgotten join and it is back.

**Minimum honest version:** one nullable field at submission, "whose sermon is this?" A name entered means excluded from growth automatically, tagged in the library, and **the report header carries the preacher's name.** That last one matters more than it looks: the debrief is written in second person, so a PDF handed from Tyler to Joe currently points "you" at the wrong man.

Open shape question: free text on the sermon (one day, reads as a label) or a small list of men the mentor is developing (two to three days, gives Joe's arc across four sermons). The second is the real product and also starts looking like a seat without the seat.

### Seats as acquisition: a reasonable bet, unproven

The argument: the shortcut is a dead end by design. Joe never gets an account and never sees the interface, so the pathway produces exactly one customer, Tyler. A seat is a distribution channel where the mentor pays for the trial, and when the seat ends Joe keeps his account and his library.

Nine of twelve subscribers came from three or four networks. Seats are the only mechanism that reaches someone outside them, with the mentor doing the introducing.

**No one has ever converted this way. Too new.** So hold it as a bet, and do not let it drive scope. What it earns is one hour inside a build already happening: **when a seat ends, send the mentee an email with his library and what a plan of his own costs.** Silent expiry tests nothing. If a year passes with no conversion, seats are a mentoring feature and not a growth channel, and that is worth knowing.

Note the tension: the dark visibility option is the **acquisition-weakest** arrangement. Joe logs in, uploads, and reads a handoff screen. Technically in the ecosystem, experientially nowhere. Default to the debrief; offer the dark version to mentors who insist.

### Two small items for whatever touches the seat-end email next

**The greeting falls back to "Hi there," and it will do so 96 percent of the time.** `notify-seat-end` reads the mentee's own `profiles.display_name`, which nobody signing up through an invite ever sets. `mentor_label` already holds the name the mentor typed for that preacher at invite time. Use it for the greeting when present, keep "Hi there" when it is null. **Wiring, not capture.**

**Scope this to the greeting only.** The same email says "your mentor" when the *mentor's* `display_name` is null, which is the same 96 percent. That is the mentor's own missing name and `mentor_label` is the wrong column for it, since `mentor_label` names the preacher rather than the mentor. **Do not fold the two halves into one fix.**

Keep going renders as bare underlined text under two paragraphs of prose, so it reads as a footnote rather than the action it is. Template change, worth weighing against deliverability.

### Closed: the invite email does not fall back to an email address

**Investigated 30 August after an invite arrived reading "someone@gmail.com wants to read your preaching." That is not a fallback and there is nothing to fix.**

`profiles.display_name` is required for the send. An empty name returns `display_name_required` from the route, and `MentorInviteFlow` gates on a "Your name" field before it will show the email form at all. The column comment says it outright: never fall back to the mentor email if null. The public invite landing page uses "a preacher you know," also not the address.

**The message that looked like phishing had an address in `display_name` because someone typed one into that field.** The reading of the email was right; the inference about the cause was wrong.

**And the 96 percent null rate on `display_name` stays as it is, deliberately.** Signup collects no name and the Account field is optional. The column comment from 28 July records the reasoning: none of the 137 accounts had a name, and adding a signup field to serve a feature few use would change the form for everyone. That still holds. **The invite gate is the only place a name is required, and it is required exactly where it matters.**

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

### Seat precedence is correct. It just has no ceiling.

Filed 29 Aug as a bug: a mentee who also pays for Coach has every submission drawn against the seat while his own credits go unused. **Reproduced on production 4 Sep, then reclassified.** Chris's call, and the right one: once you accept a mentoring relationship, it should take precedence over your own subscription. Precedence is not the defect.

**Reproduction, 4 Sep.** `cdaukas+tara2@gmail.com` (1 Apprentice seat, 0 in use) invites `chrisd@gtn.org` (Coach, 32 credits). Invite row verified correct at mint. chrisd accepts, credits unchanged. chrisd submits one sermon, "Testing Mentee," Jonah 3.

| | Before | After |
|---|---|---|
| chrisd credits | 32 | **32** |
| tara2 Apprentice seat | 0 of 2 | **1 of 2** |
| What chrisd received | — | Coaching report, no score |
| Where the score went | — | 7.5 / 10, held on tara2's card |

**What is actually wrong is that precedence is unconditional and silent.** An Apprentice seat is two sermons a month. A pastor in the pulpit weekly preaches four or five. The mentor was never going to review all of them, but today every one routes to his card with the score held, and the mentee has no way to submit as himself. He pays for ten credits he cannot reach until the relationship ends.

**Decision: precedence with a ceiling.** Seat first. When the month's seat allotment is spent, overflow to the mentee's own credits rather than blocking. This keeps precedence, stops at the boundary of what the mentor is actually reviewing, and needs one condition in the routing rather than a submit-flow change. Rejected: a per-submission "for me or for my mentor" chooser, which is the more honest design and costs a decision the user makes forty times a year with the same answer.

**Ships with disclosure, or it is still a trap.** One line on the Apprentice card and in the accept flow: the first two sermons each month go to your mentor, your own credits carry the rest. The shape of the experience changes at sermon three (scored, immediate, no held score) and that has to be stated up front.

**Open, and worth deciding alongside it:** what a mentee *without* a subscription sees at sermon three. Today the seat is simply spent. That is the most honest Coach upsell the product will ever have, because the person has just felt the constraint.

### Mentee submit line: shipped, half verified

Built and merged 4 Sep on `feat/mentee-submit-line`, production `d52bfad`. A mentored mentee now sees, above Run The Evaluation, where the sermon is going and how much of the allotment is left. Before this the page showed **"This uses one credit,"** which was false for a mentee: the submission draws on the seat and no credit moves.

Depends on `public.mentored_submissions_this_month(uuid)`, shipped separately at `51d7978`. The mentor-side counter could not be reused: under RLS a mentee cannot see diagnostic rows before release, so it returns 0 for Apprentice and dark, and a count that silently reads 0 for the most common seat type is worse than no line.

**Verified on production.** Apprentice under-cap line renders word for word with the count and the control enabled.

**Not verified.** The at-cap wall and whether the submit control is genuinely disabled. Two submissions are needed to reach it, roughly a dollar, and the day ran long. `MENTORED_ALLOTMENT_EXHAUSTED_ERROR` remains the server-side backstop, so the failure mode if the wall is wrong is degraded rather than broken. **Dark Apprentice is unit-tested only**; no dark relationship exists in production and one was deliberately not created.

### Seat allotment counts per relationship, not per seat

Found 4 Sep while re-running the verification. The mentee submit line read **0 of 2 on a seat that had already taken a submission this month.** Correct behavior for the code as written: `mentored_submissions_this_month` is scoped to a relationship id, and ending and re-inviting produces a new row.

**So ending a relationship and re-inviting resets the mentee's monthly allotment while the seat itself does not reset.** One paid Apprentice seat yields unlimited submissions to a willing mentor, two at a time, at the cost of an end-and-reinvite between each pair.

Not urgent at current volume and not a thing a confused user stumbles into, since it takes deliberate repetition. But it is the kind of hole that gets found once someone has a reason to look, and Classroom sells seats to institutions. Decide whether the allotment should key on the seat and calendar month rather than on the relationship.

### FIXED: the Mentoring page listed you as your own preacher

Found and fixed 4 Sep. Shipped at `b8a02fd`, verified on production.

**What it was.** A mentee's Mentoring page rendered their own relationship under "Your Preachers" with their own email on the card. Reproduced three times before anyone read the database, which turned out to be correct throughout.

**Two things I got wrong in the first writeup, both corrected by Step 0.**

There was no `mentor_id` predicate in app code at all. `listMentorSeatsForMentor` filtered only on status and relied entirely on RLS for visibility, and the two policies are OR'd: `mentor_relationships_select_as_mentor` and `..._as_mentee`. So the page matched either side by construction.

And the card was not rendering `invite_email_to`. Heading resolves `label ?? email ?? "Preacher"`, where email is `menteeEmail` from `auth.users` via `mentee_id`. **So there was one fault, not two.** The card rendered correct data for a card that should never have been on the page. Nobody should go looking for a second fix.

**The fix.** `.eq("mentor_id", user.id)` on the seats query, plus one sentence above the preacher list for active mentees, since a correct filter alone drops a mentee onto "No preachers yet. Invite someone you're developing," which is false in a fresh way:

> {mentor} is mentoring you.

Bound to `menteeFacingMentorName`, the same helper as the submit line and the accept flow. Not `mentor_label`, which is the mentor's nickname *for the preacher* and is the field that started this.

**Verified on production, all four.** chrisd sees Tara only and the self-card is gone; the mentee line renders; tara2 still sees chrisd as a preacher, so the filter did not break the mentor side; tara2 shows no mentee line. chrisd is dual-role, so checks one and two had to hold simultaneously, and they do.

**Cosmetic, not filed.** The mentee line sits tight under "Seats renew monthly · Manage billing · Add a seat" and reads as though it belongs to the seats block. Worth separation next time that file is open.

**Cost.** Ninety minutes on 4 Sep chasing a session-bleed theory and then a mentor-reassignment theory, both wrong, because a rendering fault wearing the costume of a data-isolation breach is indistinguishable from one until someone queries the table.

### A pending invite silently holds a paid seat

Same 4 Sep query. `chrisd@gtn.org` read "Apprentice · 2 in use · 0 more available" throughout the session, which was assumed to be test contamination. It was not. The two are the active Tara relationship and **a pending invite from 31 August labeled "Big Dawg," addressed to `cdaukas+testing123@gmail.com`, never accepted.**

`mentor_seat_type_used` counts `pending` + `active`, which is defensible, since a reserved seat should not be double-sold. But **nothing on the Mentoring page makes an unaccepted invite legible as the thing consuming capacity.** Four days on, the seat reads as used and the page shows one preacher.

A mentor who invites someone who never accepts loses a seat, sees no preacher, and has no obvious way to reclaim it. **Now that seats are self-serve, this reaches paying customers.** Either surface pending invites in the seat line, expire them, or both.

### Two data oddities in mentor_relationships, not yet chased

From the same query, worth a look and not urgent.

- One row created 4 Sep 21:06 has a **null mentor email** against the three accounts queried, so its `mentor_id` points at some fourth account. Identify it.
- **Three rows from 28 August carry `accepted_at` with `mentee_id` null.** The current accept function writes both in a single statement, and ending a relationship does not null `mentee_id`, since the 4 Sep ended rows retain theirs. So these predate the current accept path or were written by something else.

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

**1. CLOSED 30 August. The cross-criterion contradiction is gone from the live sample.** Both narratives were read on production. Criterion 7 scores 3/5: the sermon crosses the bridge, the cultural cost lands in the room, all three audiences are addressed, but the closing diagnosis ends on self-examination rather than practice, so the drifting believer leaves convicted without knowing what to do. Criterion 9 also scores 3/5: real flashes of specificity, sins named concretely, *"this is pastoral specificity at its best,"* and it asks for one actual drifting person to be pictured. **Same evidence, same score, complementary rather than opposed.** The sample was regenerated since the August diff and the contradiction went with it. **Re-verified independently 2 Sep** by curl against production: the two criteria do not even share a quote. Criterion 7 faults *"Be honest with yourself, are you drifting?"* for never becoming a concrete instruction and asks for a weekly action; criterion 9 faults *"some of you are living in a way where Jesus is barely acknowledged"* for describing a category rather than a person and asks for one pictured scene. Different quotes, different strengths cited, different growth edges, converging on the same real defect. **That is corroboration, not contradiction, and it is what the rubric should do.** Closed twice now; do not resurface.

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

### Groups: one form and one provisioning path for both Classroom and Lab

**Decided 30 August. Classroom and the Preaching Lab are the same logistics with two audiences, so they get one form, one provisioning path, and one build trigger.**

**What is actually different, and it is three things.** The buyer differs in kind: an institution has a registrar, a purchase order and a term calendar; a pastor has a card and a start date. Classroom had a five-seat, $125 floor and the Lab did not. Everything else was the same object under two names.

**The floor is dropped.** It existed to make institutional sales worth the time, and a per-person price already does that: a small cohort is a small invoice for small work.

**Seat type follows the visibility answer rather than the product name.** A Classroom seat where students read everything immediately *is* a Colleague seat at $25. A Classroom where the instructor holds scores *is* Apprentice at $12. So the form asks what each person sees; the rate falls out.

**Private libraries come free.** Seats are one-to-one, so classmates cannot see each other by construction. Nothing to build to keep that promise.

**Each preacher submits his own work.** Not offered as an option. See Tyler's entry.

**The cohort columns shipped 30 August.** `cohort_label text` and `cohort_term_end date` on `mentor_relationships`, hand-applied and recorded as `20260830150000_add_cohort_grouping.sql`, repaired, with `migration list` showing Local and Remote matching on every row. Nullable, no RLS change, no code path reads them. **`mentor_id` alone already grouped seats; it broke on one trainer running two cohorts, on term dates living nowhere, and on the invoice linking to nothing.** These three queries are what the columns buy: who is in a cohort, what ends in the next thirty days, and every live cohort with its seat mix at a glance.

**The form is live at `https://tally.so/r/obj9k1` and both products now point at it.** Classroom in PR #310, the Preaching Lab card in PR #311. See Recently closed. Precedent for the pattern is the Intensive at `tally.so/r/9qx2OK` and Teams at `tally.so/r/xX5kJJ`.

**Nothing has come through the form yet.** Both products are sellable and neither has been sold. That is the open question, and it is outreach rather than a build.

**The form, final.** Trainer name, email, organization. What are you running: a cohort or lab, a classroom, or something else. A name for the group, which becomes `cohort_label`. Term start and end. Headcount. Same arrangement for everyone or varies by person. Then per preacher: name, email, what he sees, optional note. Billing: payment link or institutional invoice with a PO. One consent line stating each preacher gets exactly one invitation and joins no list.

**Question 4 routes nothing.** Both answers provision identically. It tells you which vocabulary to use in the reply and gives you data on who is actually buying, which you do not have.

**Mid-term churn, stated in the confirmation so it is never negotiated:** a replacement is included and the total is based on the term booked. Worth being sure, since a cohort that loses three men in week two and replaces all three is more provisioning work for the same money.

**The constraint that will bite first.** `mentor_relationships` allows one active mentor per mentee, so **a man in a group cannot also have a personal mentor.** A seminary student whose pastor mentors him is exactly the person who would be in both. Know it before selling a Classroom into a school. This is the constraint the group tables were meant to solve and it stays until they exist.

**And file upload now touches the first cohort directly.** Each man submitting his own means each man needs a usable manuscript, and there is no .txt or .md upload. A lay preacher writing in Word opens the file and copies out of it, six times over twelve weeks.

**Build trigger, one not two:** automate at three concurrent groups, whichever product they are, or when tracking terms on different clocks costs more than an afternoon a term.

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

### Invite tokens are bearer tokens, and one seam check found three things

**Read-only audit, 30 August. Nothing 404s. The acceptance path degrades cleanly on every dead-token case. What it found instead is worse than a 404.**

**1. The invite token is not bound to an email address.** `accept_mentor_invite` attaches `auth.uid()` and never compares the signed-in user to `invite_email_to`. **Whoever holds the link takes the seat.** A forwarded invitation, a shared screen, a typo in the address, and the wrong person becomes the mentee: the mentor reads that person's sermons and holds their scores, and the mentee reads coaching written for someone else. Live on a lane anyone can buy into.

**2. Binding to email only closes half of it, because five of six pending invites have no email.** `invite_email_to` is null on every copy-link invite, and copy-link is the path a mentor takes when he wants to text someone rather than have the system email them. **So the common path is a permanent bearer token and nothing in the UI says so.** An unconditional bind would have returned `email_mismatch` for all five and killed a live invitation from Ben Baer with nothing to bind it to.

**Fixed for emailed invites in PR #315.** See Recently closed. **Copy-link invites are unchanged and remain bearer tokens.**

**3. Copy-link needs its own decision and should not be patched by the email bind.** Three ways: keep it as a deliberate bearer token and disclose that in the UI, require an address at creation and remove copy-link, or bind it to the first account that accepts and refuse the rest. **Open.**

**Fixed in PR #317.** The invite now sends from `chris@sermoncoach.com`. Every other sender stays on `.online`, deliberately; see the sending-domain entry below.

**Fixed in PR #316.** See Recently closed.

**What the audit cleared.** No path 404s. `preview_mentor_invite` returns the same clean "this invitation is no longer active" page for revoked, accepted, missing, and over-capacity tokens. It does not leak `invite_email_to` to the client. The signup-then-accept carry works: an invited stranger with no account gets the full invite, creates an account, and returns to the token logged in.

**Premise confirmed.** Twelve accepted relationships in production, all twelve with `accepted_at`, **all twelve mentee addresses containing `cdaukas`.** Zero real people have ever completed acceptance.

### Two loose ends from the purge job

**Shipped 4 September, PR #328. See Recently closed.** Neither of these blocks it.

**The privacy page has no backup-and-operational-copies clause.** The delete dialog promises the sermon is *permanently deleted* after 30 days. Supabase takes daily backups, so that was already approximate the day soft delete shipped in #247, independent of anything the purge job does. The dialog is the wrong place for retention nuance and should not change. The clause belongs on `privacy.html`, written in the attorney pass, not by us.

**The twelve rows in `archive._admin_row_archive` from the 18 August Tyler cleanup are still there.** The sweep is deliberately scoped to `reason like 'purge %'`, so it will never touch them. The 25 August incident write-up's own open items list says drop them unless the cleanup still needs reversing. Three weeks on, it does not. Thirty-second decision, whenever.

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

### The sending domain is `.online` everywhere and the canonical domain is `.com`

**Surfaced 30 August by a Step 0 that was supposed to be a one-line fix.** Every Resend send in the product uses `sermoncoach.online`:

| Send | From |
|---|---|
| Mentor invite | `chris@sermoncoach.online` |
| Blog | `Chris Daukas · The Sermon Coach <chris@sermoncoach.online>` |
| Operator digest | `Chris Daukas <chris@sermoncoach.online>` |
| Seat-end | `Christopher M. Daukas <sermoncoach@sermoncoach.online>` |
| Three Supabase lifecycle functions | `Chris Daukas <chris@sermoncoach.online>`, hardcoded outside `src/` |

**Both domains are verified in Resend and sending is enabled on both.** `sermoncoach.online` since 29 May, `sermoncoach.com` since 20 July with nothing sent from it.

**The invite moved to `.com` on its own in PR #317, and the rest is staying, deliberately.** Verified by a real send: Resend reported `delivered`, headers read `"Chris Daukas via The Sermon Coach" <chris@sermoncoach.com>` with Reply-To on the mentor, and it landed in the inbox rather than spam. The test invite was revoked afterward. The invite is the only email that reaches a stranger with no account and no engagement history, which is most of what protects placement, and it is the one email where spam placement kills the transaction. It also currently contradicts itself: the From says `.online` while the body links to `.com`, and that mismatch is itself a spam signal.

**Moving the rest is a real project, not a sweep.** `.online` has been sending since May and has whatever reputation it has built. `.com` is verified and cold. Moving the blog means warming a cold domain with the whole list. Price that before doing it, and do not let it drift one email at a time.

**From addresses are code constants, not env vars.** `INVITE_EMAIL_FROM_ADDRESS` at the call site, the rest in `src/lib/email/constants.ts`, and three hardcoded in Supabase functions outside the repo's `src/`. A domain move touches all four places.

**`EMAIL_DELIVERABILITY.md` is stale**, still describing `noreply@sermoncoach.online`, an address nothing uses. A doc describing a configuration that no longer exists is what an agent reads as current.

### The submission cap is defined twice

`mentored_monthly_submission_limit` in `20260806130000_mentor_seat_entitlement_and_billing.sql` returns 2 for `debrief` and 4 for `evaluation`. `mentoredMonthlySubmissionLimit` in `src/lib/mentor/allotment.ts` returns the same numbers in TypeScript. **Two definitions of one rule.** They agree today. Nothing enforces that they keep agreeing, and the pricing page now states both numbers to customers. Low priority, real drift risk.

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

### Site audit, 2 September

HeyCatch scored the site: Positioning 20/25, Conversion clarity 19/25, Trust 9/20 Fail, Paywall 13/15, SEO 9/15, Brief fit 9/10 Pass. Most of the surface findings hold. Three of its recommendations do not, and its top-ranked quick win is one to refuse.

**What survived, all carried to the priorities board as items 10 through 14.** The homepage meta description is 46 characters of 155, and the `og:description` on the same page is already the copy that belongs in it. The pricing page has no meta description, no OG tags, and no Twitter card, so a pricing link pasted into a staff Slack renders as a bare URL, which is a leak in the warm-referral channel and that is the primary channel. `how-its-scored` has no meta description either. No JSON-LD on any page, and the pricing page's visible nine-item FAQ has no FAQPage markup. `llms.txt` returns 404, which means it was requested. `/sample-evaluation` responds in 1413ms against 700ms for home and 692ms for pricing: the slowest page on the site is the strongest asset the product has and the page an outreach email points a pastor at, and the audit surfaced it in its SEO detail then left it off its own fix list. No data-handling statement near either CTA, which is the manuscript-privacy hesitation going unanswered.

**Trust 9/20 "Fail" is a rubric artifact, not a competitive gap.** The audit's own competitor research says Preach Better, the closest ICP match, shows no user count and no logo wall either, *"a similar trust profile to The Sermon Coach,"* and that the named founder with a `/story` page is a genuine advantage over both competitors, neither of whom names one. Only Sermon Forge carries badges, and its 247-church claim is unverified marketing. **Do not read the Fail as a directive.**

**Mobile 2/4 is a measurement cap.** The audit states it capped the score because real device testing was unavailable. Nothing to build against. Open the site on a phone for five minutes instead.

**Comparison-table bonus 0/1 is structurally unwinnable** at 8+ tiers under that rubric. Ignore the point. Whether eight public tiers is the right number is a separate and real question, and it is the one D4.2 actually flagged.

**New competitor data, none of it from the SermonScore diff.** Sermon Forge runs Church Team at $99/mo flat plus a 50 percent educational discount, so Pastoral Teams at $29 plus $25 per additional preacher crosses $99 at four preachers. Entry band is $15 to $30: Preach Better $15, Sermons.app $19, Sermon Forge $29, PulpitLab $30. **Neither competitor provides value anchoring near the price**, so that is a category-wide gap rather than a deficit.

### Classroom: the five-seat floor, resolved 5 Sep

**Confirmed 2 Sep. The live card is correct and the pricing is intentional:** $12/student/mo with scores held, $25/student/mo with scores visible, chosen per student rather than per class. This matches the 30 Aug groups decision, where seat type follows the visibility answer. The $25-a-seat figure and the $449 Intensive that surfaced in the site-audit review came from a stale Claude project brief, not from the product. The Intensive is settled at $549 in Decided and needs no revisiting.

**The floor was never a floor, and that is the resolution.** Three statements were in the record and read as a three-way split:

- **Decided, "Groups: Classroom and Lab," 30 Aug:** *"The five-seat Classroom floor is dropped."*
- **Decided, "Classroom":** *"still live on the pricing page at $125/mo minimum."*
- **The live card, verified by `curl -sL` 2 Sep:** *"Five-seat minimum, billed by the term."*

They are not opposed. PR #310, same day, kept the five-seat line on the reasoning that *"a four-man group is simply a Lab through the same form."* That reasoning concedes the point: if a smaller group is served through the same form under a different name, the floor rejects nobody. It is a label boundary described as a minimum.

**Decided:** five is the naming boundary between Classroom and Lab, not a purchase minimum. Nobody is turned away for size. The rejected alternatives were dropping the figure entirely, which leaves two cards priced identically at $12 and $25 differing only by tagline, and enforcing a real minimum, which either overcharges a four-student class by $48 across a four-month term (5 x $12 x 4 = $240 against 4 x $12 x 4 = $192) or refuses a buyer worth taking.

**Card bullet**, replacing *"Five-seat minimum, billed by the term"*: *Five students or more, billed by the term. Smaller groups run as a Preaching Lab through the same form.* Label text only, no data attribute and no href, so `applyBillingCadence` does not overwrite it on load or on the billing toggle.

**The related maintenance line is misdiagnosed.** "Classroom card states its price twice" reads the two prices as a duplication bug. They are the model. What the card needed was the floor question resolved and term billing carried in the bullet, which is what the replacement bullet does.

**Adjacent staleness found in the same pass.** The priorities board puts the Preaching Lab payment path at $249. That price was retired 29 Aug as a 14 percent discount on parts that goes underwater at twelve participants. The Lab is priced at parts, computed per roster. Reword the board item before it becomes a fourth stale number.

**Still open, not part of this item.** With Classroom and Lab now priced identically, the only difference left is the buyer: an institution has a registrar, a purchase order and a term calendar. That distinction is real but is currently carried entirely by two taglines.

### What a Classroom is worth, as planning arithmetic

Recorded so the institutional thesis stops being sized by feel. A Coach subscriber-year is $348.

| Twenty students, two four-month terms | Per institution per year | Coach-subscriber equivalent | Institutions to $100K |
|---|---|---|---|
| All at $12 | $1,920 | 5.5 | 52 |
| All at $25 | $4,000 | 11.5 | 25 |

Real classes will blend, so the honest range is roughly 25 to 52 institutions. **Classroom is still a better unit than individual sales and it is not the shortcut a $6,000-per-institution figure would have made it.** Every one of those is hand-provisioned today; self-serve waits for institution three. Size the plan against Chris's available hours, not against a seat count.

**One consequence for the card.** It leads with $12, and the headline number is what an institution anchors on. If the $25 full-evaluation tier is what a seminary should be buying, the card is currently arguing the other way.

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
- **`privacy.html` has no backup-and-operational-copies clause**, while the delete dialog promises permanent deletion at 30 days. Supabase daily backups make that approximate no matter what the purge job does. Same attorney pass.
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
| Who submits, in a seat | **Each preacher submits his own work. Settled 30 Aug and not offered as a choice.** A cohort where the trainer submits produces one user and eight passengers, and the seat-end email's acquisition work depends on each man having an account and a library he keeps. A pastor who wants to run someone else's sermon himself uses his own credits and needs no permission; that is a separate, supported path and the reason the preacher-name field matters. |
| Groups: Classroom and Lab | **One form, one provisioning path, one build trigger. Decided 30 Aug.** Same logistics, two audiences. Seat type follows the visibility answer rather than the product name: read-everything is Colleague at $25, instructor-holds-scores is Apprentice at $12. The five-seat Classroom floor is dropped as a purchase minimum; it survives only as the Classroom-versus-Lab naming boundary on one shared form, so no group is turned away for size (resolved 5 Sep). `cohort_label` and `cohort_term_end` on `mentor_relationships` group the seats. Automate at three concurrent groups. |
| **Preaching Lab** | **Reversed 29 Aug. Hand-sold configuration, not a fixed product and not a build.** A collection of Apprentice seats: each man reads his coaching debrief, the trainer holds every score. Cohort size, term length, and per-person visibility are all free to vary because seats are per-relationship. **Priced at parts, no discount:** Apprentice $12 per preacher per month, Colleague $25, one invoice to the trainer. The $249 flat price is retired; it discounted parts by 14 percent and went underwater at twelve participants. Tally form collects the roster with a seat type and visibility choice per man. Automate at trainer three. No scores for participants ever remains the defining constraint, enforced by discipline while hand-run. |
| **Lab growth view** | Belongs to the trainer, not the participant. Week twelve, sitting down and showing a young man what moved. A person delivering the evidence, not a dashboard. |
| **Apprentice / Colleague naming** | Already shipped and live on `pricing.html`. Stored `seat_type` stays `debrief` / `evaluation`. Apprentice names the man; Debrief only names the artifact. |
| **Classroom** | Removed from the **homepage** at `9393a9e`. Not retired. $12 per student per month with scores held, $25 with scores visible, chosen per student rather than per class. Five students or more, billed by the term, one invoice. **The five-seat figure is a naming boundary, not a purchase minimum:** smaller groups go through the same form and are provisioned as a Preaching Lab. The $125/mo minimum figure is retired, decided 5 Sep. Stays hand-provisioned; self-serve waits for institution three. |
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
- **Homepage quantity proof and the avatar grid.** The 2 Sep audit ranked this its top quick win. **Do not build it.** Any number honest enough to publish today reads as weakness; silence is stronger under 100. **Trigger:** roughly 100 pastors who have completed a first evaluation. Before it ships, settle the counting definition, signups against completed evaluations against distinct churches, because "Used by N pastors across N churches" is a substantiable marketing claim and wants a defensible, dated methodology on the page.
- **Third-party badge strip (G2, Trustpilot, Product Hunt).** Wrong audience. A pastor does not check G2 before a $29 tool, and a Product Hunt launch delivers technologists. The third-party signal that moves this buyer is institutional, a seminary name or a network name, and it comes through Thurman Williams and Jon Demeter rather than a widget. Revisit only on an institutional signal.
- **`/vs/preach-better` and `/vs/sermon-forge`.** **Trigger:** competitor-name impressions in Search Console. `/vs/chatgpt` is item 14 and is being built now; it is objection handling that happens to live at a `/vs` URL, not competitor SEO.

---

## Recently closed

**The homepage stops being silent about developing others.** 5 Sept, **PR #330**, merged at `71fc8a5`, and **PR #329**, the footer sketch link, merged the same session.

**The finding.** Counted on production before the change, visible homepage copy contained *mentor* 0, *debrief* 0, *Classroom* 0, *Preaching Lab* 0, *Pastoral Teams* 0. A lead pastor with four associates could not learn from the homepage that seats exist. Everything on the develop-others side was reachable only by clicking Pricing.

**`HomeV2Mentoring.tsx` existed and was dark, and it was not revived.** Added in `3260409`, removed from `page.tsx` in `9393a9e` on 26 Aug, never imported since, never edited. **The removal reason still holds:** pricing and institutional content belongs on the pricing page and the homepage had grown too long. That component is two seat cards, two prices and a mailto. It was deleted in the same commit that added the replacement, so the repo does not carry two components doing one job with one of them dark waiting to be found by someone who does not know why it was pulled.

**What shipped instead is a doorway, not a pricing block.** `HomeV2DevelopOthers.tsx`, rendered between `HomeV2GrowthProfile` and `HomeV2Proof`. Eyebrow *Develop others*, one heading, three short paragraphs, one link to `/pricing.html`. No prices, no seat cards, no mailto. Third paragraph, *"For a staff, a class, or a training lab, seats are billed on one invoice,"* is the only place on the homepage where Teams, Classroom and the Lab exist at all.

**The claim now outruns the proof.** The section says *"what he reads is a debrief, not a score"* and there is nowhere on the site to see one. That raises the value of the mentee-side paired sample and its public page, which becomes the section's first CTA when it lands.

**AA was deliberately not fixed here.** `.eyebrow` and `.cardlink` both use `var(--sc-accent)`, `#a67c2e` on `#faf8f3` cream, **3.57:1, AA fail**. Diverging in one section would have shipped a visible inconsistency to solve a sitewide problem. Measured alternatives on cream: `--sc-gold` `#8a6624` **4.94:1**, `--sc-olive` 7.04, `--sc-ink-soft` 7.09, `--sc-ink` 14.87. The fix is the two class rules, one branch, twelve sections at once.

**Footer.** Product column now reads Pricing, How It's Scored, Free Outline Check, Sample sketch, Sample evaluation. Sample debrief waits on the page existing.

**Verified on production by `curl -sL` with a cache-busting query string**, independently after the merge: *Develop others* 1, *debrief* 1, *one invoice* 1, *Apprentice* 0, em-dashes 6 unchanged. The Apprentice zero is the check that proves the deleted component is gone from the built page rather than only from source.

**The sermon purge job ships and the 30-day promise is now true.** 4 Sept, **PR #328**, merged at `d30d86e5`, feature commit `bcef3c0`. Migration `20260905150000_archive_service_role_grants.sql`, hand-applied, both tests walked before commit.

**What was wrong.** Soft delete shipped in #247 on 19 August with a dialog telling users the sermon is permanently deleted after 30 days. Nothing made that happen. Nine sermons carried a non-null `deleted_at`, **four of them belonging to three paying customers**, and every manuscript was still sitting in full. The first rows became eligible 18 September.

**The write path is one `SECURITY DEFINER` function, not four PostgREST calls.** Cursor's first pass did ordered client calls with no transaction, so an archive could succeed and a delete fail and leave a half-purged sermon with no rollback. `purge_soft_deleted_sermon(uuid, text)` now does archive, count-verify, null the `readiness_reads` link, then delete evaluations, versions, sermon, in one transaction that rolls back entirely on any failure. Every step re-verifies its own row count and raises on mismatch.

**It also refused to expose the `archive` schema, and that was the sharp moment.** Cursor asked to add `archive` to PostgREST exposed schemas so its client could reach the table. **That is the exact configuration of the 25 August incident**, where sermon manuscripts sat readable on the public API for seven days. The `SECURITY DEFINER` function solved both problems at once: real atomicity, and the schema stays unexposed because the function reaches it as owner.

**Two guards were added that were not in the original spec, and both proved out.** The function enforces the 30-day window itself rather than trusting the route's cutoff, and it re-asserts the skip-guards (public sample, mentored, non-terminal status) and raises rather than destroying. The route still evaluates and logs guards so report-only can report what it *would* skip. **The function is stricter than the route on purpose**: an unexpected status aborts one sermon loudly instead of destroying it quietly.

**`readiness_reads` was the Step 0 stop.** A fourth table references `sermons` with `ON DELETE SET NULL`, outside the sermons → versions → evaluations chain. Chosen: null it explicitly and log the ids. Skipping would let a routine Sketch read silently block a sermon from ever purging; relying on the FK would mutate a table outside the job's scope with no record. Zero rows are linked today.

**The sweep is scoped to `reason like 'purge %'`** so it only cleans up after itself and leaves the twelve 18 August Tyler rows alone.

**Report-only is the shipped default.** `SERMON_PURGE_DRY_RUN`, matching `PURGE_UNVERIFIED_DRY_RUN`: live only on the literal string `"false"`, so unset fails safe. Unset in Vercel. One code path; dry run skips insert, update, delete, and explicitly does not call either RPC. The sweep now logs `archive_sweep_skipped` and reports `null` rather than a fake `0`, **because a plausible number returned for the wrong reason is how a broken sweep survives to production.**

**Both tests walked on production before commit.** Negative: the function raised `P0001` at line 40 against a sermon deleted 29 August, naming the window and the real `deleted_at`, and destroyed nothing. Destructive: a junk sermon on `chrisd@gtn.org` backdated 40 days purged clean, returning `sermon_remaining 0, archived_rows 1, orphan_versions 0`. That second one is the only exercise the `service_role` archive-insert path gets, since report-only never touches it. Test archive row deleted afterward so the 18 September dry run starts clean.

**Runs daily at 15:00 UTC**, 8am Arizona, clear of the 13:00 and 14:00 crons.

**Three dates are the remaining work, and they are calendar, not code.** 18 Sept: read the dry run, expect exactly one sermon, `8fa87c77` "Baptism 2" on `chrisd@gtn.org`. 19 Sept: flip the flag, hit the route by hand with `CRON_SECRET`, verify, stay near it. 20 Sept: Tyler's row, the first customer sermon this job destroys. **The two-day gap between your own canary and the first customer row is the real control**, and it exists by accident of the delete dates rather than by design.

**A buyer who just paid no longer sees the buy page again.** 30 Aug, **PR #316**.

**What was wrong.** Stripe returned a seat buyer to `/dashboard/mentoring` the moment checkout finished, and the webhook is a separate POST. Until it landed, capacity read 0, the surface was `purchase`, and the buyer was looking at the same Apprentice and Colleague cards he had just paid for. No confirmation, no pending state. **A pastor who paid $12 and sees a Buy button reasonably concludes the payment failed, and some would have paid twice.**

**The fix polls rather than reassuring.** Success URL is now `/dashboard/develop?purchased=1`, pointed at the destination directly since `/dashboard/mentoring` is a `permanentRedirect` that **drops the query string**. When the param is present and capacity is 0, a client island polls `get_mentor_seat_capacity` every 3s and calls `router.refresh()` when the seat lands. Pattern borrowed from `IncompleteEvaluationPoller`; the RPC is granted to `authenticated` so no new route was needed.

**Ceiling is 60 seconds, not the 5 minutes the eval poller uses.** That ceiling is sized for evaluations, which genuinely take minutes. A Stripe webhook lands in seconds, and five minutes of "setting up your seat" is a second bad experience. **Reuse the pattern, not the number.**

**On timeout it stops reassuring.** *Your payment went through, but the seat has not appeared yet. Refresh in a minute, or reply to your receipt and we will sort it out*, with a Refresh button. **That message is the entire reason this polls instead of printing a static line.** A static line passes the happy-path test and leaves the buyer whose webhook actually failed reading a comfort that is not true.

**Five of six verifications walked.** The timeout was watched in a browser on a fresh zero-seat account: pending held, swapped at 60s. The already-arrived case rendered the workspace with no pending flash. No-param renders the purchase cards unchanged. Cancel carries no param and cannot show pending. Build clean, 294 tests. **Only the live Stripe purchase is unwalked**, and both of its halves are covered by the two cases above.

**Two false alarms during testing, both worth remembering.** The purchase cards appeared instead of the pending state twice: once because the browser was on production rather than localhost, and once because Safari autocompleted the URL and silently dropped `?purchased=1`. Neither was a code defect. **When a query-param branch does not fire, read the whole address bar before reading the code.**


**Emailed mentoring invites are bound to the stamped address.** 30 Aug, **PR #315**, commit `934adfd`, merged at `fa84f36`. Migration `20260831030000_bind_invite_to_email.sql`, hand-applied, production function body read **before** repair.

**What was wrong.** `accept_mentor_invite` attached `auth.uid()` and never compared the signed-in user to `invite_email_to`. Whoever held the link took the seat, so a forwarded invitation or a typo meant the mentor read the wrong person's sermons and that person read coaching written for someone else.

**Two Step 0 findings shaped the fix and one of them stopped the original spec.** An unconditional bind would have returned `email_mismatch` whenever `invite_email_to` is null, which is **five of six pending invites**, including a live one from Ben Baer with no address to bind to. So the check skips null. And the comparison uses raw lowercase rather than `normalize_email`: the normalizer strips `+tags` to deduplicate signups, which is right there and too generous for identity, since the one emailed pending invite normalizes to a match for **twenty** auth users. The column already stores trimmed lowercase, so raw lowercase compares like with like.

**Placement matters.** The check sits after `self_invite` and before `already_mentored`, so a mentor clicking his own link still gets the more useful message and a mismatch is reported before anyone is told they already have a mentor. Every prior branch and error code is unchanged.

**The invited address is never rendered.** Showing it would turn a leaked token into a way to read someone's email.

**Verified.** Matching address accepts and creates the relationship. Wrong account returns `email_mismatch` with the row count unchanged at 31 either side. **A null-email invite still accepts**, which is the check protecting Ben's invitation, and the live pending count held at 6 with zero leftover test tokens. Build clean, 291 unit tests, 12 in `invite.test.ts`.

**Fully verified 30 August, including the browser.** The RPC layer was proven first; the notice was then rendered on **production**, not localhost: signed in as the wrong account, the invite page returns *"This invitation was sent to a different email address. Sign in with the address your mentor used, or ask them to send a new invitation to the address you use here."* Specific rather than generic, actionable, and **the invited address is not shown**, which is what stops a leaked token from becoming a way to read someone's email.


**Churches and Institutions laid out as a triangle, Teams renamed, and a cap defect I introduced the same day corrected.** 30 Aug, **PR #313** at `341972f`. Live: `Pastoral Teams` 2, `Request a Team` 1, `Two sermons per student` 0, `Two sermons per man` 0, `with four` 2, `obj9k1` 4.

**Layout.** Pastoral Teams spans both columns on top, Classroom and Preaching Lab share the row beneath. Achieved with `grid-column: 1 / -1` on the Teams tier via a modifier class, not by changing the grid definition. Below 880px the grid was already one column and all three stack.

**Naming, display text only in three places:** the tier name, the CTA (capital T), and the orientation jump card, which the original brief missed and Step 0 caught. `id="teams"` and `href="#teams"` are unchanged, so the anchor still works. `src/`, the docs, the migration comment and Stripe metadata are untouched; seat metadata is `debrief` / `evaluation` / `mentor_seat` and never said Teams.

**The cap defect, and it was mine.** PRs #310 and #311 both stated a flat two submissions per month. **That is the Apprentice cap. Colleague is four.** `mentored_monthly_submission_limit` returns 2 for `debrief` and 4 for `evaluation`, single definition, never replaced. The old Classroom line *"4 credits per seat"* had the number right and the word wrong; correcting the word broke the number. Both cards now fold the cap into the visibility bullet, since the choice and the cap are the same choice: *coaching without the score at $12 with two sermons a month, or the full evaluation at $25 with four.* The Teams card's "each team member gets four" was always correct, since Teams is Colleague-only.

**Noted for maintenance:** the cap exists twice, in the SQL function and in `src/lib/mentor/allotment.ts` as a TS mirror. Two definitions of one number that can drift.


**The Preaching Lab has a card on the pricing page.** 30 Aug, **PR #311** at `b742cad`. Live: `obj9k1` returns 4, `Register a Preaching Lab` 1, `preaching-lab` 1.

**Moved to Churches and Institutions the same day, PR #312 at `6cdef49`.** It shipped into Develop Others on the reasoning that the Lab is a pastor developing preachers at scale. **That was wrong about the buyer.** The Lab is bought by a church running a training lab, which is the same purchaser as Teams: an organization buying for its people. It now sits with Teams and Classroom, and Develop Others is back to the single mentor seat card.

**The tagline was rewritten in the same pass**, because the original was written for an individual pastor. It now reads: *For a church running a training lab. A preaching cohort in your church plant, a class in your association, the men your church is raising up.*

**Priced at $12 per preacher per month**, matching Classroom, so the only difference between the two cards is who they are for. Note reads: *Or $25 for the ones who see their scores. Any size, any term, one invoice.* No floor, unlike Classroom's five seats.

**The card deliberately carries no data attributes at all.** No `data-price`, `data-period`, `data-note`, `data-tier-cta`, or `data-mentor-*`. Step 0 confirmed `applyBillingCadence` reads only the first four on `['coach','cohort']` and the mentor swap reads only `data-mentor-*`, so a card carrying none is invisible to both. **The Lab has no monthly-versus-annual distinction and no seat-type swap, so it must not move when either control is touched.** Verified by toggling both: Coach went $29 to $290 and back, the mentor card became Colleague and back, and the Lab did not change either time.

**Step 0 also corrected the insert point.** The brief said "after the Colleague card." There is no Colleague card. `#mentoring` holds one `.tier` that swaps between Apprentice and Colleague on `data-mentor-*`. Same information, one node.

**The last feature bullet is doing acquisition work:** *When the term ends, every man keeps his sermons and his coaching.* It reassures the buyer and it means eight people have libraries when the term is over.

**Orientation was left alone, deliberately.** The three headings sort by intent rather than listing products. Turning them into a table of contents would mean every new product needs a link or looks omitted, which is the maintenance the Develop Others placement avoided.


**Classroom is sellable. Priced at $12, registration goes to the form.** 30 Aug, **PR #310**, commit `9d0627a`, merged at `4171cf3`. Live greps: `obj9k1` returns 3, `Register for Classroom` 1, `Classroom%20interest` 0, `4 credits per seat` 0, `125` 0.

**Three things were wrong and one of them meant Classroom had no intake at all.** The CTA was `mailto:chris@sermoncoach.com?subject=Classroom%20interest`, which collected none of the roster data provisioning needs. The headline read "from $125" and the features said "$25 per seat," both assuming Colleague-only seats. And "4 credits per seat" promised something nothing delivers; a seat is two submissions per calendar month.

**What it says now.** $12 per student per month as the headline, with "Or $25 if students see their scores" underneath. Leading with the lower number and naming the choice is deliberate: it opens a pedagogical conversation with a professor rather than inviting a price comparison. **The five-seat minimum stays** because it signals institution, and a four-man group is simply a Lab through the same form. **"Everything in Coach for every preacher in the class" was cut** as an oversell; a seat is not a Coach subscription.

**Step 0 is why this shipped correctly.** `applyBillingCadence` overwrites `data-price`, `data-period`, `data-note`, and the CTA **href** on load and on every billing toggle. **Markup alone would have looked right in the file and reverted the instant the page loaded.** The label is markup-only and would have stuck; the href would not.

**`obj9k1` appears three times, not two**, and that is correct: the markup href plus both the monthly and annual `checkoutUrl` entries. Both cadence objects must carry it or the toggle writes the old mailto back. Monthly and annual stay identical, since a term-billed product has no annual price and inventing one would be wrong.

**Verified by toggling the live pill both ways:** Coach moves to $290 on annual, Classroom holds at $12 and keeps the Tally URL. That is the check a grep of the markup would have passed while the page was broken.


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
- **The homepage is not static.** "Marketing pages stay static" is true of `public/*.html` and false of the homepage, which is `src/app/page.tsx` composed from `src/components/home-v2/*`. Assuming otherwise wrote a do-not-touch rule that forbade the only editable file and cost a Step 0 round trip on 5 Sept.
- **Match the case flags between the count you reason from and the check you ship.** An expected count derived with `grep -oi` and verified with case-sensitive `grep` returned 1 against an expected 3 and looked like a failed deploy. The deploy was fine.
- **The `9393a9e` boundary governs homepage additions.** No prices, no seat cards, no mailto. A link out to pricing is fine. Anything that fails that test belongs on the pricing page.
- **Dead components get deleted, not left dark.** An unimported component with no history reads as parked rather than retired, and the next agent revives it without knowing why it was pulled.
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
- **A destructive write path belongs in one `SECURITY DEFINER` function, not in ordered client calls.** The purge job's first draft did archive and three deletes as separate PostgREST calls, which is not a transaction. The function form also kept the `archive` schema off the public API, because a definer function reaches it as owner. Atomicity and exposure turned out to be the same problem with one answer.
- **The last line before permanent destruction should not trust the caller.** The purge function enforces its own 30-day window and re-asserts the skip-guards rather than taking the route's word for eligibility. Neither check was in the spec; the window check is what a wrong cutoff calculation would hit first.
- **A code path that returns a plausible number for the wrong reason is worse than one that errors.** Report-only reported `0` swept because the archive read failed, not because the flag said skip. `null` and an explicit skip log are honest; a zero is a measurement nobody took.
- **When a tool asks to relax a control to make its own code work, the control is usually right and the code is wrong.** Cursor asked to expose the `archive` schema. Rewriting the write path cost one message and removed the ask entirely.
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
- **Ask what a form question would let a buyer opt out of.** "Who submits the sermons?" looked like reasonable discovery. It would have let a trainer choose the version that produces one user and eight passengers, opting out of the entire acquisition mechanism. Some questions are better answered by the product than asked of the customer.
- **Two products with the same logistics should share one provisioning path.** Classroom and the Preaching Lab were carried as separate products with separate build triggers. They are seat collections with a roster, a term and an invoice, differing only in who buys and what you call it. One form, one path, one trigger.
- **A grep of the markup can pass while the page is broken.** The Classroom CTA, price, period and note are all overwritten by `applyBillingCadence` on load and on every billing toggle. Editing the markup would have left the file correct and the rendered page wrong, and every static check would have agreed with the file. When a value is written by JS at runtime, the verification is loading the page and exercising the control, not grepping the source.
- **Place a product by who buys it, not by what it resembles.** The Preaching Lab was filed under Develop Others because it looked like mentoring at scale. The buyer is a church running a training program, which is the same purchaser as Teams. Two PRs on the same day for a placement one question would have settled: who signs for this.
- **Correcting the wording of a wrong line can break the number in it.** The Classroom card said "4 credits per seat." *Credits* was wrong, so it became "two sermons per student," which fixed the noun and broke the count: Colleague seats allow four. The old line was half right and the correction was half wrong, in the other half. When rewriting a line that states a fact, check the fact separately from the phrasing.
- **Reuse the pattern, not the number.** `IncompleteEvaluationPoller` polls for five minutes because evaluations take minutes. Copying that ceiling onto a Stripe webhook, which lands in seconds, would have replaced one bad screen with another. Borrow the mechanism and re-derive the constant from what it is now waiting for.
- **When a query-param branch does not fire, read the whole address bar before reading the code.** Twice in one test the pending state failed to appear. Once the browser was on production instead of localhost, once Safari autocompleted the URL and dropped the query string. Neither was a defect, and both looked exactly like one.
- **A one-line fix that turns out to be the default is a decision, not a line.** Changing the invite From from `.online` to `.com` looked trivial until Step 0 showed every sender in the product uses `.online`. Fixing one makes it the outlier; fixing all of them warms a cold domain with the entire list. **Ask what else does this before changing the one in front of you.**
- **`sed` line-range deletion is useless against minified HTML, and it fails silently.** `/sample-evaluation` is 179 KB on one line, so `sed '/<script/,/<\/script>/d'` treats the whole document as a single range and deletes everything. Two greps returned empty and both looked like findings. The pipe that works is `perl -0pe 's/<script.*?<\/script>//gs; s/<style.*?<\/style>//gs; s/<[^>]*>/ /g'`. **Every curl-and-grep extraction used in this ledger used the broken form; the ones that returned content were fine, the ones that returned nothing may have been lying.** Also: `grep -E` caps repetition at 255, so `.{400}` errors out.
- **When a two-minute check reaches twenty minutes, stop and open the browser.** Three extraction failures went by before the obvious move: load the page, expand the two sections, read them. Terminal verification is right when the answer needs to be pasted or repeated; it is not automatically right.
- Verify against the thing, not against the account of the thing. Failures so far: a migration history table that lied, a repo doc read as production config, a competitor's surface read as his depth, a sermon's account of its own passage read as the passage, an invisible Turnstile widget read as a broken one, this ledger's own inflation-check framing retired 12 August and carried forward anyway, a fetch tool's 404 read as production state, and a single-file grep read as a code-path audit.
- **A generic conversion audit grades against a generic funnel.** The 2 Sep audit ranked an avatar grid first for a product with twelve subscribers, and scored trust as Fail while its own competitor research said the closest ICP match has the same trust profile. **Read the sub-scores, not the headline grades**, and check whether a finding is a real gap, a measurement cap, or a rubric artifact before building against it.
- **A rendering fault can wear the costume of a data breach.** On 4 Sep the Mentoring page showed an account as its own preacher, and the next ninety minutes went to session-bleed and mentor-reassignment theories before anyone read the row. **Query the table before theorizing about the code.** One `select` against `mentor_relationships` would have ended it in the first five minutes, and the same is true of most "the app is showing me the wrong account's data" moments.
- **Test a second identity in a second browser, never a private window in the same one.** Not because private windows leak, they did not here, but because the possibility is unfalsifiable in the moment and it poisons every observation until ruled out.
- **A predicted bug is not a confirmed bug, and reproducing it can change what it is.** The credit bypass sat as a reasoned-from-code note for six days and read as a clear defect. One $0.50 submission confirmed the behavior and then reframed it: seat precedence is the intended design, and the real gap is that it has no ceiling and no disclosure. **Reproduce before ranking, and be ready for the finding to turn out to be a product decision rather than a fix.**
