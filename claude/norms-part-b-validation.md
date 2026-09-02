# Part B validation

Written and run 26–27 August 2026 in a sandbox, not in the repo.
Module: `sermon_parsers.py`. Raw output: `norms-run-output.json`.
Reference values from `claude/claude_corpus-derivation.md`.

**Verdict: the module runs, the screens work after two fixes, and it independently reproduces the corpus's known genre confound. Three instruments match reference, four run consistently ~30% low, and one is badly broken.**

---

## Sample: 21 files, 17 usable

| genre | n | files |
|---|---|---|
| wisdom | 6 | Ecclesiastes ×5, Psalm 67 |
| Acts | 4 | Acts 18, 19, 20:17-24, Acts 2:42-47 |
| OT narrative | 3 | 1 Samuel 2, Jonah 3, Jonah 4 |
| epistle | 2 | 1 Timothy 6, Romans 8 |
| prophecy | 1 | Isaiah 40 |
| apocalyptic | 1 | Revelation 3 |

**Rejected, all correctly:** two under 1,200 words, one 777-word outline, one 354-word teaching plan caught on two independent grounds.

---

## The result that matters: the book confound reproduces independently

The gospel clarity reads found gospel vocabulary density varies ~5.8-fold by book (John 7.06, Ecclesiastes 1.22) and that **book explains 20.7% of the variance against year's 5.3%.**

This parser, written from the summary and never tuned, returns:

| genre | n | Christ density /1k |
|---|---|---|
| apocalyptic | 1 | 11.66 |
| Acts | 4 | 8.23 |
| epistle | 2 | 5.89 |
| prophecy | 1 | 5.36 |
| OT narrative | 3 | 4.01 |
| **wisdom** | **6** | **2.78** |

**A 4.2-fold spread, wisdom at the floor, in the same order.** This is stronger evidence than any level match, because a reimplementation can hit a mean by luck and cannot reproduce a pattern by luck.

**It also confirms the fairness problem for criterion 2 in a second way.** A pastor preaching Ecclesiastes scores about a third of one preaching Acts on Christ density, from the text he was given.

---

## Against reference

| instrument | corpus mean | reference | verdict |
|---|---|---|---|
| **median sentence length** | **12.79** | 12.4–13.7 | **match** |
| edge share | 0.445 | 0.515 | close |
| all-caps /1k | 9.37 | 11.9 | close |
| agency share | 0.116 | 0.176 | **~34% low** |
| Christ density /1k | 5.32 | 7.16–8.92 | **~34% low** |
| locus count | 3.94 | 5.41 | **~27% low** |
| locus spread | 7.06 | 9.8–10.1 | **~29% low** |
| **interior:exterior** | **1.83 median** | 1.61 | **fixed 27 Aug, now matches** |
| TRD | 1 of 17 fire | — | **still untested** |

**The four "low" figures are all low by roughly the same third.** That is one systematic cause, not four bugs: my lexicons are narrower than the originals. Recover the original word lists rather than tuning each instrument. Note also this sample is 35% Ecclesiastes, which pulls every Christ-related measure down, so part of the gap is composition — **the same trap rule 0d exists for.**

---

## The badly broken instrument, now fixed

**Was: 6 of 17 sermons detected zero exterior imperatives, ratio 4.11 against a 1.61 reference.
Now: 1 of 17, median 1.83.**

Two changes, 27 August. Added the exterior verbs the corpus actually uses — `come`, `take`, `listen`, `read`, `open`, `set`, `put`, `get`, `turn`, and others — to a list that had been written from memory. And **restricted the hybrid rule to the main clause**, cutting at the first quotation mark or subordinator, so an exterior verb inside quoted scripture no longer promotes the sentence.

The frozen rule was always sound. The implementation was thin. Original misclassifications, all now correct:

- `Come to church eager to learn` → interior. Should be exterior.
- `Come a few minutes early` → interior. Should be exterior; witnessable, with an occasion.
- `Take notes where God is speaking truth to you` → interior. Should be exterior.
- `Remember Jesus' words as he commissioned his disciples in Matt 28...` → exterior. Should be interior; the hybrid rule fired on *go* inside quoted scripture.

**Two fixes.** `EXTERIOR_VERBS` is missing `come`, `take`, `listen`, `read`, `open`, `set`, `put`, and more; build it from corpus frequency, not from a list written in conversation. And **restrict the hybrid rule to the main clause**, since it currently promotes on any exterior verb anywhere including inside quotations.

**This is Chris's to finish, not Cursor's.** The verb list is a homiletics judgment.

---

## Two screen bugs found and fixed

**1. The markdown footnote apparatus survived cleaning.** Acts 18 returned 81 outline points, a median sentence length of 4, and 22.7 cross-references per 1k. The `<a id="footnote-N">` numbered list was being parsed as outline structure. After the fix: 5 points, median 15, 2.9 cross-refs.

**2. The byline screen fired on `played by Sylvester Stallone`**, rejecting a 4,632-word Revelation sermon. Now positionally constrained to short lines near the top, plus a separate author-block pattern matching the shape of the Ortlund file.

**Worth noting: this screen has now failed in both directions in this project** — missing Ortlund four consecutive times and rejecting a Rocky illustration once. It needs the positional constraint permanently.

---

## Still outstanding

- `Why_Community__` returns **56 outline points.** A different footnote apparatus. Find it before Part C.
- **TRD has fired once in 17.** The instrument with the best evidence in the project is effectively untested here. Needs manuscripts with collapsed endings; the 2 Cor 3 manuscript that stops writing at the climax is the ideal case.
- **RI fires on 3 of 17** and cannot be validated without hand-coded mutual-ask counts.
- **The outline test has never fired on a full manuscript.** The one outline-format file was 777 words and correctly rejected.

---

## A correction to record

I claimed the containment screen had missed a re-preach, because `Acts_20-17-24` and `Acts_20-17-38` share sermon number `#291` and the date `8/16/15` while scoring 0.473, under the 0.50 threshold.

**Wrong.** Only 190 of 1,147 six-word sequences overlap, 16.6%, and nearly all are the printed Acts 20 passage both files quote. One is "Don't Waste Your Life" on verses 17-24; the other is "Final Farewell" on 17-38, opening with Lincoln. Two different preparations for one slot. The screen was right.

**I asserted from a surface signal without checking the prose** — the project's own documented failure mode. Schema fact worth keeping: **sermon number and date are not a reliable identity key**, and a collapse rule built on them would wrongly merge two real sermons.

---

## What Cursor does with this

1. Recover the original lexicons for Christ tokens, loci, church words and caps from the source reports. One systematic fix, not four.
2. Fix the `Why_Community__` outline-point bug.
3. Wait on the interior/exterior verb list.
4. Source manuscripts with collapsed endings and test TRD before trusting it.
5. Re-run Part B, then Part C.
