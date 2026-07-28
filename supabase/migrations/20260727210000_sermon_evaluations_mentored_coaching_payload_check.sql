-- Hard backstop: mentored coaching rows must not carry evaluation
-- payload or scores (they are readable by the mentee). Scoped to
-- rows with mentor_relationship_id set so existing Coach-tier
-- Mentor Mode coaching rows (mentor_relationship_id null) pass.

alter table public.sermon_evaluations
  add constraint sermon_evaluations_mentored_coaching_payload_check
  check (
    mentor_relationship_id is null
    or report_mode = 'diagnostic'
    or (result is null
        and overall_score is null
        and score_band is null)
  );

comment on constraint sermon_evaluations_mentored_coaching_payload_check
  on public.sermon_evaluations is
  'A mentored coaching row is readable by the mentee, so it must not carry evaluation payload or scores. This is a hard backstop independent of RLS.';
