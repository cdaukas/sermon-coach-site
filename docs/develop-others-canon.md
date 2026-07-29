# Develop-others lane, canon

**Last updated: 2026-07-29**

This file is the current shape of the develop-others lane. It supersedes every
earlier document, chat, brief, and Asana note by definition. If something
elsewhere conflicts with this file, this file wins and there is nothing to
adjudicate.

Update the date at the top whenever anything below changes. An entry with no
date under it inherits the file date.

Do not delete superseded entries silently. Move them to the Retired section so
the next person can see what changed and stop resurrecting it.

---

## Seats

Mentors self-serve. Mentees are invited, never self-serve.

| Seat | Price | What the holder gets | Hold |
|---|---|---|---|
| Debrief | $12/mo | 4 debriefs/month. Every submission also generates a full evaluation. | Yes |
| Evaluation | $25/mo | 4 submissions/month yielding 8 results: 4 debriefs + 4 evaluations. | No |
| Mentor | Included with Coach while holding seats | Reads all mentee work. No grant of its own. | n/a |

The debrief seat is the same machine as the evaluation seat with the evaluation
half held back. It does not produce fewer artifacts. It shows fewer. This is why
the hold is a `released_to_mentee_at` timestamp on the evaluation row rather
than a flag controlling whether an evaluation runs.

- Mentor holds 1 to 4 seats. The cap is enforced, not advisory. Five or more is
  Classroom. Classroom's floor is 5, so there is no gap between the two paths.
  **Changed 2026-07-28. Live.**
- Monthly reset anchors to the mentor's Coach billing date. The first cycle does
  not reset.
- Grandfathering for existing Mentor Mode users goes to the evaluation seat.

## The hold

Applies to the debrief seat only.

- Every submission on a debrief seat generates a debrief and a full evaluation.
  The mentee reads the debrief. The evaluation is held.
- The mentee sees that an evaluation ran. He sees the date, marked closed. He
  does not see contents.
- Once every 90 days the mentor can open one held evaluation early. The mentor
  picks which one, not the mentee.
- The hold exists so the mentor can deliver hard findings himself before the
  mentee reads them cold on a screen. It is for conversation, not punishment.

## Release triggers

All held evaluations open when any of these fire:

1. Mentor ends the relationship. Immediate.
2. Seat lapses on payment. 30-day grace, then release.
3. Mentee ends the relationship. 30-day grace, then release.
   **Decided 2026-07-28. Not yet built.**

Trigger 3 replaces the earlier rule that a mentee walking away did not release.
That rule left a departing mentee holding up to 48 permanently sealed
evaluations of his own preaching after a year, which is not defensible.

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

Classroom seats carry 4 debriefs so that a mentor seat and a classroom seat never
differ at the same price.

## Terminology

- "Relationship end," never "term end." Term language is retired.
- `report_mode` values are `diagnostic` and `debrief`. `coaching` is dead in the
  database. A legacy tolerance branch remains in `normalizeReportMode` for stale
  browser storage only. Do not remove before 2027.
- Preacher-facing report names: The Sketch, The Evaluation, The Debrief.
- Billing currency is "credits," not "evaluations."

## Relationship model

- One mentor per mentee, enforced by partial unique index.
- One mentor to many mentees, up to the 4-seat cap.
- Entry is by invite only, consensual, single-use token.
- Invite context must be read at account creation, not at a later accept step,
  or you lose people who sign up first.

## Database surface

All functions are SECURITY DEFINER.

- `create_mentor_invite(p_seat_type text) -> text`. Requires `debrief` or
  `evaluation`. Caps at 4 seats across pending + active. Raises on violation with
  a bare `raise exception`, no `USING ERRCODE`, so PostgREST returns SQLSTATE
  `P0001` and the message `seat limit reached: a mentor may hold at most 4
  seats`. Callers must catch the exception and match on that text. The zero-arg
  overload is gone; calling without `p_seat_type` returns `PGRST202`.
- `accept_mentor_invite(p_token text) -> jsonb`. Error codes:
  `not_authenticated`, `invalid_or_used`, `self_invite`, `already_mentored`.
- `preview_mentor_invite(p_token text) -> jsonb`. Callable by anon. The only
  unauthenticated surface. Falls back to "a preacher you know" when the mentor
  has no display name.
- `set_display_name(p_display_name text) -> text`. Trims, rejects blank, caps at
  80 chars.
- `is_mentor_of_relationship(uuid) -> boolean`
- `relationship_holds_evaluations(uuid) -> boolean`

Tables: `mentor_relationships`, `profiles.display_name`,
`sermon_evaluations.released_to_mentee_at`. All writes go through the RPCs.

## Build order

1. **Shipped.** Display name prompt + invite creation UI at
   `/dashboard/mentoring`. PR #172, merged at `5990f34`. `/mentor/invite`
   redirects here.
2. **Shipped.** `/invite/[token]`, public, root layout only, calling
   `preview_mentor_invite` server-side. Seat-branched disclosure. PR #173.
   `/mentor/accept` redirects here with the token preserved, currently a 307
   that should be a 308.
3. **Shipped.** Invite context surviving signup. Never built this session; the
   work already existed and was verified end to end on production 2026-07-29,
   twelve checks, token `e4f36c55` consumed. Two independent recovery routes,
   both live: the `mentor_invite` cookie (httpOnly, `.sermoncoach.online`, 30
   days, so apex and www both see it) and the token nested inside `next`, which
   `mentorTokenFromNextPath` recurses to find. Same browser uses the cookie,
   different device uses the nested `next`.
   Verified chain: `/auth/confirm?token_hash=...` 307, `/mentor/accept?token=`
   307, `/invite/[token]` 200. It does not pass through `/auth/callback` or
   `/start`.
   Signup confirmation mail uses the token_hash template against
   `/auth/confirm`, not PKCE against `/auth/callback`. That is deliberate and
   documented in the route file: it works cross-device because there is no code
   verifier. `/auth/confirm` carries its own copy of
   `destinationWithMentorInvite` and reads the invite cookie itself.
   Invited mentees arrive with `acquisition_source` null, since the attribution
   gate never fires on this path. Deliberate, tracked in Asana.
4. Invite email via Resend.
5. Mentee dashboard, where the hold becomes visible.

Gates on step 3, both cleared 2026-07-29:
- The magic-link failure was not a bug. The 2026-07-28 walkthrough generated
  its link with `auth.admin.generateLink`, which does not use PKCE and returns
  tokens in a URL hash fragment rather than as `?code=`. `/auth/callback` reads
  only `code`, so it fell through correctly. The app has no `signInWithOtp`
  calls at all; every real send site builds a PKCE link that does return
  `?code=`.
- The seat-cap concern is gone. Three exposed tokens were revoked, leaving
  `adf905dd` with one pending invite and two free seats. Revoke is real:
  `preview_mentor_invite` filters on status and returns `invalid_or_used` for a
  revoked token. There is still no mentor-facing revoke UI or RPC.

Useful property found 2026-07-29: `accept_mentor_invite` rejects `self_invite`
without consuming the token, so the accept path can be tested repeatedly against
your own invites without burning them.

## Open

- Two 30-day clocks now exist on the same relationship, seat lapse and mentee
  exit. Confirm they are one timer and cannot both run.
- Accept-invite disclosure copy still describes the superseded "mentor runs an
  evaluation every 90 days" model. Corrected wording is in Asana.
- Seat pricing and cancellation terms do not exist in `terms.html`. Terms and
  privacy have been attorney-reviewed, but seats were not in that scope. The new
  section needs a follow-up read.
- Whether the earlier attorney review covered only `terms.html` and
  `privacy.html` as documents, or also the mentor model and asymmetric read. If
  only the former, the accept-invite disclosure is still unread.
- No verification that a mentor pays for the seats he creates.
- Nothing records seats purchased versus seats assigned.
- Invites never expire.
- Release on seat upgrade. Debrief to evaluation should open everything held.
- Quarterly counter anchor: relationship start or billing quarter.
- Refund posture for seats. Subscriptions carry 30-day money-back. Seats
  undecided.

## Retired

Do not reintroduce any of these.

- **"The confirmation email returns to `/auth/callback?code=`."** Wrong for
  signup. Template-based signup mail goes to `/auth/confirm?token_hash=`.
  `/auth/callback` handles PKCE only, and nothing in `src/` sends a magic link.
- **Mentee walking away does not release.** Replaced 2026-07-28 by the 30-day
  grace above.
- **Coach-conversion unlock / dormancy model.** Evaluations dormant until the
  mentee buys Coach. Considered and rejected 2026-07-28.
- **"Mentor can run a full evaluation every 90 days."** From the 2026-07-24 lanes
  doc. Replaced by the hold model, where evaluations always run and the mentor
  opens one early per 90 days. This one has resurfaced twice. It is the single
  most likely thing to walk back in.
- **3-seat cap.** Replaced by 4 on 2026-07-28. The 3-cap left a mentor who
  wanted a fourth seat with nowhere to go, since Classroom's floor is 5. Four
  closes the gap.
- **Zero-arg `create_mentor_invite()`.** Dropped. `p_seat_type` is required
  because it decides whether the mentee ever sees his own scores.
- **`/mentor/invite` as a rendering route.** Redirects to `/dashboard/mentoring`
  as of PR #172. It renders nothing of its own.
- **`/mentor/accept` as a rendering route.** Redirects to `/invite/[token]` as of
  PR #173. The carry and clear routes underneath it are still live and in use.
- **The old MentorAcceptForm consent copy.** Said the mentor "can request a full
  evaluation of a sermon you submit," which is the superseded model, and
  disclosed nothing about the hold. Deleted in PR #173, not adapted. A mentee
  accepting under that copy would not have been told his own evaluations were
  being withheld.
- **`self_invite` and `already_mentored` on the preview page.**
  `preview_mentor_invite` returns only `invalid_or_used`. The other two come from
  `accept_mentor_invite` and render after the accept click.
- **120-day term / semester shape.** Borrowed from Classroom, abandoned in favor
  of monthly seats.
- **"Term end" language.** Replaced by "relationship end."
- **Cohort tier.** Fully retired. Replaced by Classroom.
