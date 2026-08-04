# Rewrite register calibration reference

Reference set for the suggested-rewrite sections: "What Improvement Looks Like"
(scored eval, `rubric.md`) and BLOCK 3 "What It Looks Like" (Mentor Mode,
`coaching-prompt.ts`). Both surfaces read the shared partial at
`src/lib/evaluation/rewrite-register.md`.

Established August 3, 2026, on branch `feat/rewrite-register`.
Eval prompt version at capture: v3.4.

Purpose: when the register drifts, or when a new surface gains a rewrite path,
diff against these pairs rather than against a description of the rules. The
hand-written rewrites are the calibration anchor. The rules in the partial were
derived from them, not the other way around.

Source sermon: Hebrews 2 and 3, preached by Chris Daukas. Both model outputs
below predate the register partial.

---

## Pair A — application landing

**Preacher's original**

> APPLICATION: The more you honestly consider Jesus, the more superior you will
> see Him to be. Keep considering Jesus. Don't ever stop.

**Model output, pre-register**

> The more you honestly consider Jesus, the more superior you will see Him to
> be. So make it a real practice, not a vague resolve. This week, take five
> minutes each morning and read Hebrews 2 and 3 out loud, slowly, before the
> phone gets a vote. That is what considering looks like on a Tuesday: forcing
> one quiet moment to see who he is and what he has done, so that by Sunday your
> loyalty is not running on fumes. Don't ever stop.

**Hand-written rewrite (anchor)**

> The more you honestly consider Jesus, the more superior you will see Him to
> be. So make it a real practice, not a vague resolve. Tomorrow, take five
> minutes in the morning and read Hebrews 2 and 3 out loud, slowly, before you
> are finished with your morning cup of coffee. And do that each day, thinking
> about who Christ is and what He's done, so that by Sunday your loyalty isn't
> running on fumes but is anchored to the one who bled and died for you. Keep
> looking to Jesus and don't ever stop.

**What the hand-written version changed**

- Cut "that is what considering looks like on a Tuesday." The model restated an
  instruction the preacher had just read, in a more evocative register. It added
  no information.
- Swapped "before the phone gets a vote" for "before you are finished with your
  morning cup of coffee." Same constraint, same slot. The phone line is a
  knowing joke that draws attention to the person saying it. The coffee line is
  a homely detail every person in the room is holding.
- Refused to land on "running on fumes." The model ended on the image of the
  deficiency. The rewrite pushes past it to the cross.
- Went longer, not shorter: 86 words to 110. Length was never the problem.
  Every addition moves toward the person and work of Christ.
- Kept the opening line and the closing line verbatim.
- Kept the antithesis "a real practice, not a vague resolve" untouched.

---

## Pair B — expositional seam

**Preacher's original**

> Now here's where the story goes: The issue in this church was that they were
> under pressure, under persecution for being Christians, and it was just easier
> to turn back to Judaism, to turn back to following Moses and the law.

**Model output, pre-register**

> We have considered who Jesus is and what he has done. Now watch what the
> author does next, because it is the pastoral heart of the passage. These
> believers were tempted, under pressure, to slide back to Moses and the law,
> the easier and more respectable road. So the author sets Jesus beside Moses,
> and here is the one thing to carry home from it: both were faithful, but
> sonship is greater than servanthood. Jesus is not merely a better servant in
> the house. He is the Son over it.

**Hand-written rewrite (anchor)**

> We have considered who Jesus is and what he has done. Now watch what the
> author does next because it is the pastoral heart of the passage. These
> believers were tempted, under pressure, to slide back to Moses and the law,
> the easier and more respectable road. So the author puts Jesus next to Moses
> to show off the superiority of Christ over the easy road. And he does it not
> by tearing down Moses, but highlighting the supremacy of Jesus. Both were
> faithful, but sonship is greater than servanthood. Jesus is not merely a
> better servant in the house. He is the Son over it.

**What the hand-written version changed**

- Cut "here is the one thing to carry home from it." A claim about how to
  receive the sermon, spoken from the pulpit, is a leak of evaluator vocabulary.
- Kept "because it is the pastoral heart of the passage." A claim about the text
  is ordinary expositional speech. This is the line between the two.
- Plainer verb: "sets Jesus beside Moses" became "puts Jesus next to Moses."
  Monosyllabic, spoken, no literary reach.
- Named the purpose: added "to show off the superiority of Christ over the easy
  road." The model stated the comparison and left the reason implicit.
- Guarded Moses before making the point: "not by tearing down Moses, but
  highlighting the supremacy of Jesus." Christ is not made greater by leaving
  Moses in the dirt.
- Dropped the preacher's own transition ("Now here's where the story goes") in
  favor of the model's. Retention protects load-bearing phrasing, not every
  phrasing.

---

## Rules that did not survive contact with the anchors

Recorded so they are not reintroduced.

**Ban the not-X-but-Y antithesis.** Rejected. Across both hand-written rewrites
there are three antitheses and each earns its place. Every one protects
something from a misreading: the application from being heard as sentiment,
Moses from collateral damage, the servant category from collapse. It is a
working homiletical move, not a model tic. Two in one passage can read as
manufactured weight; a blanket ban is wrong.

**Stop at the concrete.** Rejected as written. Pair A runs three clauses past
the specific instruction and is better for it. The correct rule is directional,
not positional: what comes after the concrete must move toward Christ, never
toward wit.

**Cap rewrite length.** Rejected. Both anchors are longer than their originals.
The failure was never expansion. Subtraction must remain legal, but it is not
the default.

**Preserve the preacher's wording.** Kept, but weakened. Pair B drops the
preacher's own transition. The rule protects what is load-bearing, and a weak
transition may be replaced.

---

## Known root cause, fixed in v3.4

`rubric.md` line 138 instructed the model to rewrite "in Chris's voice," a
fossil from the single-user era. Every paying preacher received an instruction
to imitate a man the model has never read. Given a named voice it cannot
identify, the model falls back on polished literary pulpit prose, which is the
register that reads as AI. Replaced with an instruction pointing at the
manuscript already in context.

Mentor Mode BLOCK 3 never carried the named-person bug; it already said "in this
preacher's own register and voice." Which means the two surfaces had different
root causes for similar-feeling output, and the shared partial is carrying more
weight on the Mentor Mode side than on the eval side.
