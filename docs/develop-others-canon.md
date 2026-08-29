# Develop-others lane, canon

This is reference, not status. It describes how the Mentoring lane is
shaped: seats, the hold, terminology, routing, schema. It does not track
what is open, in progress, or shipped. The ledger is not in this repo. It
lives in Chris's Claude project and is not readable from here. If you need
current state, ask him rather than guessing or reading a stale doc.

The **user-facing product name is Mentoring**. The rail item is **Mentoring**,
under a Developing others group. Teams, Preaching Lab, and Classroom become
their own rail items under that header. A pastor holds three different
relationships with three different groups of people, and collapsing them
into one nav item implies they are variations of one thing. Do not rename
this file, the `/dashboard/develop` route, or database identifiers to match
the rail string.

Canonical dashboard route is `/dashboard/develop`. `/dashboard/mentoring`
permanently redirects to it. Do not delete the mentoring route.

---

## Seats

Mentors self-serve. Mentees are invited, never self-serve.

Display names and database values are not the same. `seat_type` in the database
stays `debrief` or `evaluation`. UI copy uses **Apprentice** and **Colleague**
only. The single mapping lives in `src/lib/mentor/seat-labels.ts`
(`mentorSeatDisplayName`). Do not invent a second map or rename the database
values.

| Display name | `seat_type` | Price | What the holder gets | Hold |
|---|---|---|---|---|
| Apprentice | `debrief` | $12/mo | 2 submissions/month. Every submission generates a debrief (and How It Preaches) the mentee reads, plus a full evaluation that is held until release. | Yes |
| Colleague | `evaluation` | $25/mo | 4 submissions/month yielding 8 results: 4 debriefs + 4 evaluations. Nothing held. | No |
| Mentor | n/a | Included with Coach while holding seats | Reads all mentee work. No grant of its own. | n/a |

The Apprentice (`debrief`) seat is the same machine as the Colleague
(`evaluation`) seat with the evaluation half held back. It does not produce
fewer artifacts. It shows fewer. This is why the hold is a
`released_to_mentee_at` timestamp on the evaluation row rather than a flag
controlling whether an evaluation runs.

`mentored_monthly_submission_limit` is 2 for `debrief` and 4 for
`evaluation`. There is no flat 4.

- Mentor holds 1 to 4 seats. The cap is enforced, not advisory. Five or more is
  Classroom. Classroom's floor is 5, so there is no gap between the two paths.
- Grandfathered free seat for active Coach subscribers: one permanent
  Apprentice (`debrief`) capacity outside Stripe
  (`profiles.comp_debrief_seats`). Does not expire by calendar.
  `create_mentor_invite` reads this column before Stripe inventory so those
  mentors never paywall on a gift they already hold.

## The hold

Applies to the Apprentice (`debrief`) seat only.

- Every submission on an Apprentice seat generates a debrief and a full
  evaluation. The mentee reads the debrief (and How It Preaches). The evaluation
  is held.
- The mentee sees that an evaluation ran. They see the date, marked closed. They
  do not see contents.
- Release of a held evaluation is at the mentor's discretion with no period.
  There is no 90-day (or any other) cadence.
- The hold exists so the mentor can deliver hard findings before the mentee
  reads them cold on a screen. It is for conversation, not punishment.

## Release triggers

All held evaluations open when any of these fire:

1. Mentor ends the relationship. Immediate. `end_mentor_relationship` releases
   held evaluations because a manual end is a considered act.
2. Mentor releases an individual held evaluation. Immediate, at discretion,
   no period.
3. Seat lapses on payment. The cancel webhook does not release held
   evaluations, because a cancel can be an expired card. Do not "fix" this
   into parity with the RPC.
4. Mentee ends the relationship. 30-day grace, then release.

Trigger 4 replaces the earlier rule that a mentee walking away did not release.
That rule left a departing mentee holding up to 48 permanently sealed
evaluations of their own preaching after a year, which is not defensible.

Considered and rejected: unlocking held evaluations on Coach conversion. It is
commercially the strongest option and it is the reason the earlier dormancy
design existed. Rejected because "pay to read the assessment of your own
preaching that someone else already read" is a sentence that reads badly in
terms and worse in a complaint.

`released_to_mentee_at` is write-once, trigger-enforced.

## Boundary with Classroom

The crossover is billing, not headcount. Individual seats are a personal card,
month to month. Classroom is an invoice for a term. Seminaries, denominations,
and networks that cannot put recurring charges on a personal card are Classroom
buyers regardless of size.

Classroom seats carry 4 credits so that a mentor seat and a classroom seat never
differ at the same price.

## Terminology

- "Relationship end," never "term end." Term language is retired.
- `report_mode` values are `diagnostic` and `debrief`. `coaching` is dead in the
  database. A legacy tolerance branch remains in `normalizeReportMode` for stale
  browser storage only. Do not remove before 2027.
- `seat_type` values are `debrief` and `evaluation` only. Display names are
  Apprentice and Colleague; see Seats above and
  `src/lib/mentor/seat-labels.ts`.
- Preacher-facing report names: The Sketch, The Evaluation, The Debrief.
- Billing currency is "credits," not "evaluations."
- Neutral pronouns. Standing rule, no exceptions. Mentoring copy uses they /
  theirs, the person's name, or a rewrite. Do not use he / him / his or she /
  her / hers for a mentee, preacher, mentor, or pastor.

## Relationship model

- One mentor per mentee, enforced by partial unique index.
- One mentor to many mentees, up to the 4-seat cap.
- Entry is by invite only, consensual, single-use token.
- Invite context must be read at account creation, not at a later accept step,
  or you lose people who sign up first.
- `mentee_reads` on `mentor_relationships` is nullable text. `'debrief'` is
  stored as NULL and only `'none'` is ever written. NULL and `'debrief'` must
  always mean the same thing. Do not backfill.
- `debrief_visible_since` is a nullable timestamptz. `enable_mentee_debrief`
  flips `mentee_reads` to NULL and stamps `now()`. Forward only, one direction.
  The gate hides when the seat is `'none'` or when the stamp is set and the
  evaluation's `created_at` precedes it. Forward-only lives in three places:
  the policy, `getMenteeCoachingView`, and the per-sermon preacher card.
- `seat_end_email_sent_at` on `mentor_relationships`.

## Routing

Routing is automatic. A mentee with an active relationship submits
into that relationship, always. There is no per-submission choice and
no mode picker. When the seat's monthly allotment is spent, submission
is blocked; it does not fall back to the mentee's own credits. A mentee
who also holds a Coach subscription cannot reach those credits while
the relationship is active. This is a known consequence, accepted
because the Apprentice (`debrief`) seat is built for the preacher who is not
already paying for Coach.

Invite context survives signup on two independent recovery routes: the
`mentor_invite` cookie (httpOnly, `.sermoncoach.com`, 30 days, so apex and
www both see it) and the token nested inside `next`, which
`mentorTokenFromNextPath` recurses to find. Same browser uses the cookie,
different device uses the nested `next`.

## Database surface

All functions are SECURITY DEFINER.

- `create_mentor_invite(p_seat_type, p_mentor_label, p_mentee_reads)`.
  Requires `debrief` or `evaluation`. Optional `p_mentor_label` is the mentor's
  name for this preacher, stored on `mentor_relationships.mentor_label`; blank
  stores null. Optional `p_mentee_reads` is `debrief` (stored null) or `none`
  (dark Apprentice). Colleague always stores null. Capacity is purchased seats
  of that type plus `comp_debrief_seats` for Apprentice. Raises on violation
  with a bare `raise exception`, no `USING ERRCODE`, so PostgREST returns
  SQLSTATE `P0001` and the message `seat limit reached: no available seats of
  this type`. Callers must catch the exception and match on that text. The
  zero-arg overload is gone; calling without `p_seat_type` returns `PGRST202`.
- `accept_mentor_invite(p_token text) -> jsonb`. Error codes:
  `not_authenticated`, `invalid_or_used`, `self_invite`, `already_mentored`.
- `preview_mentor_invite(p_token text) -> jsonb`. Callable by anon. The only
  unauthenticated surface. Falls back to "a preacher you know" when the mentor
  has no display name.
- `set_display_name(p_display_name text) -> text`. Trims, rejects blank, caps at
  80 chars.
- `is_mentor_of_relationship(uuid) -> boolean`
- `relationship_holds_evaluations(uuid) -> boolean`
- `relationship_mentee_reads_none(uuid, timestamptz) -> boolean`. True when the
  relationship is still dark (`mentee_reads = 'none'`), or when it was opened
  later and this evaluation was created before `debrief_visible_since`.
- `enable_mentee_debrief`. Mentor only, active, `'none'` only. Flips
  `mentee_reads` to NULL and stamps `debrief_visible_since` to `now()`. No
  table UPDATE grant.
- `end_mentor_relationship` releases held evaluations. The cancel webhook does
  not.

Tables: `mentor_relationships` (`mentor_label` is the mentor's optional label
for the preacher on that seat, never `profiles.display_name`; `mentee_reads`;
`debrief_visible_since`; `seat_end_email_sent_at`), `profiles.display_name`,
`sermon_evaluations.released_to_mentee_at`. All writes go through the RPCs.
