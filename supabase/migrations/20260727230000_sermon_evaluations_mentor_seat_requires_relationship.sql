-- mentor_seat only makes sense on a mentored row (allotment is
-- metered on mentor_relationships). The reverse is deliberately
-- not enforced: a mentored row may later draw on the mentee's own
-- pack credit.

alter table public.sermon_evaluations
  add constraint sermon_evaluations_mentor_seat_requires_relationship_check
  check (
    credit_source is distinct from 'mentor_seat'
    or mentor_relationship_id is not null
  );

comment on constraint sermon_evaluations_mentor_seat_requires_relationship_check
  on public.sermon_evaluations is
  'mentor_seat only makes sense on a mentored row because the allotment is metered on mentor_relationships. The reverse is deliberately not enforced because a mentored row may later draw on the mentee''s own pack credit.';
