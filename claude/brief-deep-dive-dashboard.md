# Cursor brief: the Deep dive dashboard

One concern: let a subscriber pick a theme, choose his sermons, and generate a report — once a quarter — and show him how far he is from unlocking it.

Branch off `feat/movement-report`. That branch carries both themes and must merge first.

---

## What exists

Two themes built: `ask` and `christ`. Both render through the shared prep-card view. Both generate from "most recent 24" with no selection step, no cap, and no gate beyond `prep_card_access`.

**This brief replaces the generate flow, not the reports.**

---

## The rules

**Twelve sermons unlocks the first report.** A quarter of weekly preaching, so the number teaches the cadence rather than fighting it.

**One report per quarter, across all themes.** Not one per theme. Four themes at one a quarter is the two-year model; per-theme would let a preacher exhaust two years of content in a month.

**The preacher picks the theme.** Choosing keeps it coaching rather than a rotation he is handed.

**The preacher picks the sermons.** He knows which uploads were drafts, re-uploads or someone else's manuscript. Minimum twelve selected, maximum thirty — **the cap is about cost, not statistics.**

**Coach tier, $29.** Not gated behind a higher tier. Growth's $49 gate exists for a feature nobody has read; this one is a reason to stay.

---

## Step 0. Read-only. Report and stop.

1. **Current eligibility.** For every account with `prep_card_access` off as well as on: how many have 12 or more non-deleted sermons with text? Name the counts, not the accounts. **Expect this to be small** — a prior count found 58 users, 36 at exactly one sermon, and only four above eleven, one of whom is Chris.
2. **Where would a quarterly cap be stored?** Is there an existing pattern for per-user rate limiting, or does this need a new column or table?
3. **What does the sermon list already have?** Title, date, `primary_passage`, word count, manuscript-or-transcript. The picker needs enough for a preacher to recognise a sermon by sight.
4. **Does anything currently call the theme generators with a fixed "most recent 24"?** Report every call site, since all of them change.

---

## Part A. The unlock bar

On the Deep dive page when the subscriber has fewer than twelve sermons.

```
Your first deep dive opens at twelve sermons.

  ●●●●●●●●●○○○      9 of 12

Three more and you can run your first report.
```

**This is the most valuable thing on the page for most subscribers**, because almost none of them qualify today. It converts a limitation into a reason to upload the sermons sitting in their Dropbox.

**Count only what would be eligible** — non-deleted, with text. Do not count toward the bar anything the picker would not offer.

---

## Part B. Theme selection

Four themes exist in the model; two are built. Show all four. **The unbuilt two are visibly coming, not hidden** — it tells a subscriber the product has two years in it.

```
  The ask                    Does your ask land on anyone?          [ Choose ]
  Christ in the sermon       Does Christ act, or is he the
                             destination?                            [ Choose ]
  Who is in the room                                           Coming
  Delight and difficulty                                       Coming
```

**A theme he has already run shows when**, and stays choosable. A preacher may want the same theme twice and that is his call.

---

## Part C. The sermon picker

After choosing a theme.

**A list of his sermons**, newest first, each with title, date and passage. **The most recent twenty-four pre-selected**, so the common case is one click.

**Minimum twelve, maximum thirty.** The button is disabled outside that range and says why.

**Show the running composition as he selects**, because this is where the picker earns its place:

```
  18 selected · 14 manuscripts, 4 transcripts
  Mostly epistles (8) and Old Testament narrative (4)
```

**Do not restrict on composition. State it.** A preacher who picks eight sermons from eight different books gets a report where criterion 2's counts partly report his reading plan, and the existing genre caveat already handles that — but he should see it before he generates, not after.

**Each new report opens the picker fresh** with recent sermons pre-selected. Never silently reuse a previous selection.

---

## Part D. The quarterly cap

One report per rolling quarter, per subscriber, across all themes.

**When locked, say when it opens and offer what is available:**

```
You ran The ask on 14 September. Your next deep dive opens 14 December.

Your prep card is always available and updates whenever you want it.
```

**The prep card is never rate-limited.** It is the working document for the quarter between reports.

**Movement reports do not count against the cap.** They answer a question the diagnostic asked and are already gated by their own eight-new-sermon threshold.

---

## Part E. The small-sample line

**A report at twelve sermons is roughly two thirds of one at twenty-four**, and the report should say so rather than let a preacher read a thin page as a verdict.

What thins: the strengths floor needs 50% of the eligible sample, so at twelve that is six, and **a subscriber can easily get zero strengths**. The manuscript-only measures halve again if half his sample is transcripts, and a count of 2 of 6 is an anecdote rather than a rate. The quote pools shrink, so a strength at 9 of 12 shows three examples instead of five.

**Do not lower the floor at small samples.** That invents a rule to hide a fact. Say the fact.

Under the header, on any report built from fewer than about eighteen sermons:

> Built from twelve sermons. Counts move a lot at this size, and a
> measure that looks weak may need another quarter before they become
> more concrete.

Same discipline as the strengths note, applied to sample size. It costs nothing and it stops a thin first report reading as a judgment.

---

## Verification

- An account with 11 eligible sermons sees the bar at 11 of 12 and cannot generate.
- An account with 12 can choose a theme and reaches the picker.
- The picker refuses fewer than twelve or more than thirty selected, and says why.
- Composition updates live as sermons are selected and deselected.
- Generating writes the selected sermon ids to the snapshot, so the report and any later movement baseline know exactly what was measured.
- A second generate attempt inside the quarter is refused with the date it opens.
- The prep card still generates while the report is locked.
- Trend still loads for a `growth_access` account without `prep_card_access`.
- A report built from fewer than eighteen sermons carries the small-sample line; one built from more does not.
- A report where no measure clears the 50% floor still renders, with the existing strengths note, and does not error or hide the section.

---

## Open for Chris

1. **Twelve may still be too high for the base you have.** Step 0 item 1 gives the real number. If it comes back as one or two accounts, the bar is doing all the work and that is acceptable for a first pass — but worth seeing before the copy promises anything.
2. **The rolling quarter versus the calendar quarter.** Rolling from the last generation is simpler and fairer. Calendar means everyone unlocks on the same day, which is worse for support and better for a newsletter. Rolling is assumed here.
