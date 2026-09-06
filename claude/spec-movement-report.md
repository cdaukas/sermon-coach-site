# The movement report

The second half of the six-month arc. Product spec.

6 September 2026. Companion to `claude/spec-quarterly-report-and-card.md`. Evidence in `claude/claude_corpus-derivation.md`.

---

## The model this belongs to

**Four themes, eight quarters, two years.**

| | |
|---|---|
| **Q1** | Diagnostic report on theme A. Names three things to work on. |
| **Q2** | He works. The prep card carries the three. **A movement report at the end.** |
| **Q3** | Diagnostic on theme B. |
| **Q4** | Work, then movement. |

And so on through four themes: the ask, Christ in the sermon, who is in the room, delight and difficulty.

**Twelve weeks is not long enough to change how a man writes on Saturday. Twenty-four is.** The diagnostic names it, the work quarter is his, the movement report answers it.

**The movement report is the payoff and the risk.** It is the quarter where the product earns trust or loses it, because it is the only artifact whose job is to say whether the coaching worked.

---

## The rule everything else serves

**The movement report must be able to say nothing moved, plainly, in its first two sentences.**

If it flinches, finds an encouraging angle, or reframes a flat count as progress, the whole loop becomes a compliment machine and every prior report is retroactively suspect.

This is not a tone preference. It is the only thing that makes the diagnostic reports believable.

---

## The sample: what gets compared

**The baseline is the exact sermon set the diagnostic ran on**, stored at generation with its ids, not recomputed. Recomputing risks a different sample answering a different question.

**The comparison set is only the sermons preached since.** Not the whole corpus.

If the diagnostic read 24 and he has preached 13 since, the movement report compares **24 against 13**, and says so on its face. Pooling the 37 lets the original 24 dilute the new 13 and turns real change into noise.

**Minimum to run: 8 new sermons.** Below that the report does not generate, and the page says what it is waiting for.

> Your movement report opens at eight new sermons. You have five.

**Print the sample on the face, always.**

> Your first 24 sermons, June through August, against the 13 you have preached since.

---

## What counts as movement

Three counts, three verdicts. Nothing else.

**Moved.** The rate changed by at least a third of the baseline rate **and** by at least three sermons in absolute terms. Both, not either. A jump from 1 to 2 clears a third and is one sermon.

**Held.** Anything smaller in either direction.

**Slipped.** Down by the same threshold.

**These numbers are provisional and set by eye.** They should come from the norms run, which is parked on the privacy decision. Say so in the method note rather than implying they are derived.

**Rate, never raw count.** Twenty-four sermons against thirteen. "You went from 2 to 4" is meaningless across unequal samples. `2 of 24 → 4 of 13` is the honest form, and the report shows both numbers.

---

## The report

### 1. The verdict, first

Before anything else. Three lines, one per discipline, no preamble.

```
Naming the cost        2 of 24  →  6 of 13     moved
Making obedience visible  5 of 24  →  4 of 13   held
Asking for one another    5 of 24  →  5 of 13   held
```

**A preacher gets the answer in four seconds.** Everything after this is why.

### 2. The one that moved

Full treatment, and this is the section the whole model exists for.

The count. Then **his own before and after, both verbatim.** The thin ask from the baseline set, and a real ask from the new set that names a cost. Sermon titles on both.

Not a rewrite. **Not the model's version of what he should have said. What he actually said, twelve weeks later.**

```
WAS      "Where God has enabled you to be generous — thank God."
         Test Acts 4, July

NOW      "Give something this month you will feel. Not the leftovers."
         Colossians 3, October
```

Then one paragraph on what changed and what it cost him, from a fixed library keyed to the measure and to `moved`.

**If more than one moved, give each this treatment.** If none did, this section does not exist and the report says so.

### 3. The ones that held

Shorter. The count, and one paragraph that does not console.

> Making obedience visible held. 5 of 24, then 4 of 13. Twelve weeks
> of attention and the rate did not change. That is worth knowing
> rather than working around.

Then one specific thing to try that is different from what the diagnostic asked, because the first instruction did not work. **Not the same instruction louder.**

### 4. What you did not work on

The other measures in the theme, reported briefly. Some will have moved without attention, which is information: it usually means the work on one discipline pulled a neighbouring one along.

**Do not credit this as success.** Report it and let it stand.

### 5. What comes next

If two or three moved, the theme closes and the next diagnostic follows.

If one or none moved, **offer the same theme for another six months** rather than moving on. A preacher who has not fixed his conclusions does not need a different subject.

That offer is his to accept. **The product does not decide he has failed.**

### 6. What the report will not claim

One short standing block, every time.

> These are counts from your own sermons. They cannot tell you whether
> a sermon was faithful, whether anyone obeyed, or whether God used it.
> They tell you what you did more of and less of.

---

## What this report must never do

**Never pool the samples.** Twenty-four and thirteen are two sets and stay two sets.

**Never report a raw count difference across unequal samples.**

**Never find an encouraging angle on a flat count.** The words are "held" and "did not change."

**No percentages.** `2 of 24 → 6 of 13` is exact. "150% improvement" is noise wearing a suit.

**No score, no grade, no overall verdict on the quarter.** Three disciplines, three answers.

**Never claim causation.** He worked on it and it moved. Whether the work caused the movement is not knowable from this, and the report should not imply otherwise.

**No new focus areas.** This report answers a question. The next diagnostic asks a new one.

---

## The prep card in the work quarter

The card carries the three disciplines through the twelve weeks between reports. **That is the card's job in this model**, and it is why the two artifacts do not compete: the report diagnoses and answers, the card is what sits on the desk in between.

The card should show the three current disciplines and their baseline counts, and nothing about themes he is not working on.

---

## Storage

At diagnostic generation: the three measures, their baseline counts, the sermon ids in the baseline set, the theme, and the date.

At movement generation: the new counts, the new sermon ids, the verdicts, and the quoted before/after offsets.

**Both keyed to the theme**, so the second pass through a theme two years later can compare all four points rather than two.

---

## Open

1. **The movement thresholds are set by eye.** A third of baseline and three sermons. They need the norms run, which is parked on privacy. Mark provisional on the card's method note.

2. **The intake quarter is the commercial weak point.** A new subscriber waits three months for the first diagnostic. Consider gating the first report on sermon count rather than calendar, so a backfilled corpus produces one in week three.

3. **Does a slipped count get its own treatment?** Currently it reads as the inverse of moved. It may deserve more care, since a discipline that got worse under attention is a real finding and an uncomfortable one.

4. **Four themes assumes the other three get built.** Only the ask exists. Christ in the sermon and who is in the room are next; delight and difficulty needs a counter for softening moves.
