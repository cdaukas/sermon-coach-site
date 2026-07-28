-- Additive mentor SELECT on mentored evaluation rows.
-- Grants nothing on rows with mentor_relationship_id null
-- (every currently live row).

create policy sermon_evaluations_select_as_mentor
  on public.sermon_evaluations
  for select
  to authenticated
  using (
    mentor_relationship_id is not null
    and public.is_mentor_of_relationship(mentor_relationship_id)
  );
