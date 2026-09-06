# Theme 2: Christ in the sermon

The second quarterly report. Product spec plus copy.

6 September 2026. Format from `claude/spec-quarterly-report-and-card.md`. Evidence in `claude/claude_corpus-derivation.md`. Companion: `claude/spec-movement-report.md`.

---

## What this theme asks

**Does Christ act in this sermon, or is he its destination?**

Criterion 2 leads. Criterion 3 supplies the second and third measures. The two are related and not the same: criterion 2 asks whether the sermon's movement is Christ's movement, criterion 3 asks whether an unbeliever could follow the good news.

**Why 2 leads.** Agency is the best-validated instrument in the project — machine r ≈ +0.91 twice, κ = 1.000 across 520 span labels — and the census line is the most striking sentence available anywhere in this work.

**Reversible.** If reading the draft suggests criterion 3 should lead, the measures do not change, only the order and the framing.

---

## The measures

| # | measure | counts | evidence | quotable | rewrite |
|---|---|---|---|---|---|
| **C1** | **Christ acts in your prose** | Christ as grammatical subject of a finite, non-copular action verb, over all Christ mentions | machine r = +0.925, +0.903; κ = 1.000 on 520 spans; pooled agency 0.176 | yes, the span is a sentence | yes |
| **C2** | **Christ acts in a main point** | outline points where Christ is grammatical subject of a finite action verb | **census: 21 of 4,227 points, 10 of 497 manuscripts** | yes, the point head | yes |
| **C3** | **The cross has a named object** | gospel spans naming a specific thing defeated, absorbed or purchased | 7.4× separation, r = +0.295, survives normalisation | yes | yes, cleanly |
| **C4** | **The gospel is in the skeleton** | a gospel word inside a numbered main point | 20 of 41 load-bearing vs 1 of 14 removable, **7:1** | yes, the point head | yes |
| **C5** | **Someone outside the faith is addressed** | sermons with a non-Christian address | 17–25% of 443; median position 88–91% through; **1 of 443 asks a physical step** | yes | yes |

**C2 and C4 are manuscript-only.** A transcript has no outline. Where the corpus is mostly transcripts the theme runs on three measures and **the report says which one it could not see.**

**Do not attempt load-bearing versus removable.** Four instruments returned r between −0.09 and +0.04; position is uninformative at +0.038. It has no surface signature and cannot be judged from a single read.

---

## Three things this theme must handle that the ask theme did not

### 1. Genre gets printed, never adjusted

Agency moves with genre at **F = 5.58, p = .0025**. Gospel narrative runs roughly double wisdom. The norms parser independently reproduced a **4.2-fold spread** on Christ density: apocalyptic 11.7, Acts 8.2, epistle 5.9, OT narrative 4.0, wisdom 2.8.

**A pastor preaching Ecclesiastes scores a third of one preaching Acts, on the text he was handed.**

One line under the count, always:

> These 24 sermons were mostly Ecclesiastes and the Psalms. This number
> moves with the book. Wisdom literature runs about a third of what
> gospel narrative runs, and that is the text, not you.

**Do not adjust the number.** Inventing a genre correction nobody validated is the exact failure this method exists to prevent.

### 2. C2 gets its own copy register

Corpus-wide, Christ is the subject of an action verb in **one outline point in two hundred**, and in **one manuscript in fifty**. Most subscribers will show zero.

A focus item at 0 of 24 cannot read as an accusation for doing what 98 percent of preachers do. **The register is invitation, not deficit.**

Nearly everyone shows zero. Here is what it looks like when someone does it, and here is what it changes.

### 3. State what could not be measured

If C2 or C4 is null because the corpus is transcripts, say so on the face:

> Two of these five need a written outline, and 18 of your 24 came in
> as transcripts. This report ran on three.

---

## Interpretation copy

Same rules as `claude/prep-card-interpretation-copy.md`: one concrete anchor, varied sentence length, one hammer line, no em-dash workhorsing, name the instinct underneath the habit.

### C1 · Christ acts in your prose

**high**
> Jesus does things in your sentences. He carries, absorbs, finishes, comes back. That sounds obvious and it is not what most preaching does. The common shape is Christ as a modifier — the blood of Christ, the mission of Christ, the love of Christ — where he is attached to a noun and never picks anything up. When he is the subject of a verb, the sermon has somewhere to move.

**low**
> Christ appears constantly in your preaching and he almost never does anything. He shows up in the genitive: the grace of Christ, the work of Christ, the name of Christ. Grammatically he is furniture. This is not a doctrine problem, it is a sentence problem, and it is the single most fixable thing in this report. Give him a verb and watch what has to change around it.

### C2 · Christ acts in a main point

**high**
> Jesus does something in your skeleton, not just in your paragraphs. Across 497 manuscripts and 4,227 numbered points, that happens 21 times. When it happens the sermon's movement is his movement, and the application has somewhere to come from instead of arriving on its own.

**low**
> Almost nobody does this. One outline point in two hundred, corpus-wide, has Jesus doing something. So this is not a mark against you; it is an open door most preachers walk past. Your points name topics and truths, and Christ shows up inside them doing the explaining. Make him the subject of one point and the sermon has to go somewhere it was not already going.

### C3 · The cross has a named object

**high**
> When you name the cross you say what it dealt with. Wrath, the curse, the debt, the grave. That specificity is what separates a gospel sentence from a gospel gesture, and it is why your people can tell you what happened rather than only that something did.

**low**
> Your cross sentences are mostly "for our sins" with nothing put inside the phrase. It is true and it is a placeholder. The hearer supplies the content or he does not, and mostly he does not. Name the thing. Wrath absorbed, a debt paid, a curse taken, death broken. A cross with a named object is a cross a person can picture.

### C4 · The gospel is in the skeleton

**high**
> The gospel is in your outline, not only in your prose. That is the clearest structural difference between a sermon where the gospel carries an argument and one where it is applied at the end like a coat of paint. Twenty of forty-one load-bearing sermons put a gospel word in a numbered point. One of fourteen removable ones did.

**low**
> Your gospel lives in the paragraphs and never in the frame. Delete every gospel sentence and the argument still stands, which means the gospel is warming the sermon rather than holding it up. Put a gospel word in one main point and you will find out quickly whether the rest of that point still works.

### C5 · Someone outside the faith is addressed

**high**
> You talk to the person who has not decided. Most sermons address the in-group by default and remember him in the last ninety seconds, if at all. Yours does not, and the people in your room who are still working it out know that.

**low**
> Your preaching assumes everyone listening already believes. Across 443 sermons in this corpus the unbeliever is addressed in about one in five, at a median of ninety percent of the way through, and **exactly one asks him to do anything physical.** He is described his danger and given no verb. Speak to him once, in the first half, and give him something to do.

---

## Growth questions

| measure | question |
|---|---|
| C1 | What is Christ doing in this text? |
| C2 | Where does that belong in my outline? |
| C3 | At the cross he absorbed ___. Can I fill the blank from this passage? |
| C4 | Would this argument still stand if I deleted every gospel sentence? |
| C5 | What am I asking the person who does not yet believe? |

**C3's question is a fill-in-the-blank on purpose.** If a preacher cannot complete it from the passage he is preaching, the gospel move in that sermon is a tag.

---

## Rewrite constraints

The rewrite fixes the marker. It does not improve the sentence. Pass the specific marker in with one worked example, exactly as the ask theme does.

| marker | the rewrite must |
|---|---|
| C1 | make Christ the grammatical subject of a finite action verb |
| C2 | make Christ the subject of a verb in the point head |
| C3 | name a specific thing the cross dealt with |
| C4 | put a gospel word inside the numbered point |
| C5 | address the unbeliever and give him something to do |

**Worked examples, into the prompt:**

```
C1  WAS  The blood of Christ covers every sin you have committed.
    NOW  Christ carried every sin you have committed and did not
         set it down until it was finished.

C2  WAS  3. Our hope in suffering
    NOW  3. Christ carried the suffering you cannot carry

C3  WAS  He died for our sins.
    NOW  He absorbed the wrath that was aimed at you, and there is
         none left over.

C4  WAS  2. Living in freedom
    NOW  2. Freedom Christ bought, not freedom you earned
```

**C5 gets no worked example.** Only one sermon in 443 supplies a model and it should not be treated as the template. The constraint alone.

---

## What this report must not do

**No adjusted-for-genre number.** Print the caveat.

**No load-bearing claim.** No surface signature.

**No percentages.** Counts, and sermons as the denominator.

**No deficit framing on C2.** One in two hundred is the corpus rate.

**No score.** Not for the theme, not for the criterion.

**Never claim a sermon is or is not Christ-centred.** These measures count grammatical and structural facts. A sermon can be full of Christ and score low, and the report says so where it belongs.

---

## Build order

1. **Counters.** C1 and C2 need the spaCy dependency parse and there is no Python path in the app. **Options: a thin service, or a TS dependency-parse library validated against the reference values.** Do not approximate silently — C1 is r ≈ 0.91 twice and an approximation loses that.
2. **C3, C4, C5** are a coding call plus a parser and reuse the ask theme's machinery.
3. **Ranking, copy, surface** reuse what exists.
4. **Genre detection** for the caveat line, from `primary_passage`.

---

## Open

1. **C1 and C2 need spaCy and the app has no Python path.** The service was correctly declined once for one measure. **Two measures, one of them the theme's spine, is a different trade.** Decide before building.
2. **Genre detection** does not exist. It needs a book-to-genre map and `primary_passage` parsing, which the norms parser has in part.
3. **Whether criterion 3 should lead instead.** Criterion 2 is the stronger instrument; criterion 3 is closer to what a pastor thinks he is measured on. Read the draft and decide.
4. **C2 will be zero for most subscribers.** Watch whether the invitation register holds when the count is zero three quarters running.
