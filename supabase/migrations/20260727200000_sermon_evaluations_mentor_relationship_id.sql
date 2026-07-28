-- Optional link from an evaluation to a mentoring relationship.
-- Null = ordinary Coach-tier work (including Mentor Mode).
-- Non-null = produced inside a mentoring relationship.

alter table public.sermon_evaluations
  add column mentor_relationship_id uuid null
    references public.mentor_relationships (id);

create index sermon_evaluations_mentor_relationship_id_idx
  on public.sermon_evaluations (mentor_relationship_id)
  where mentor_relationship_id is not null;

comment on column public.sermon_evaluations.mentor_relationship_id is
  'Null means this evaluation is not part of a mentoring relationship (ordinary Coach-tier work, including Mentor Mode). Non-null means it was produced inside a mentoring relationship and is subject to the asymmetric read rules.';
