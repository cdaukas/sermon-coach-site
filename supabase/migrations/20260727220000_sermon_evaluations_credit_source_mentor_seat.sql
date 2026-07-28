-- Allow mentor_seat as a credit_source value for evaluations
-- authorized by a mentoring seat (rather than free / subscription / pack).

alter table public.sermon_evaluations
  drop constraint sermon_evaluations_credit_source_check;

alter table public.sermon_evaluations
  add constraint sermon_evaluations_credit_source_check
  check (
    credit_source is null
    or credit_source = any (array['free', 'subscription', 'pack', 'mentor_seat'])
  );
