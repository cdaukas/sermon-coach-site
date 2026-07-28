-- Narrow mentee policies for mentored rows.
-- The mentee owns every evaluation produced from his own sermon,
-- including mentored diagnostic rows he must not read. SELECT
-- therefore excludes mentored diagnostic rows. UPDATE, DELETE, and
-- INSERT exclude all mentored rows: a mentored coaching row is a
-- receipt with no payload and nothing to edit, and neither party
-- should unilaterally delete relationship work. Excluding INSERT
-- means mentored evaluations must be created server-side under the
-- service role, which bypasses RLS.

alter policy sermon_evaluations_select_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and (mentor_relationship_id is null
         or report_mode = 'coaching')
  );

alter policy sermon_evaluations_update_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and mentor_relationship_id is null
  )
  with check (
    owner_id = auth.uid()
    and mentor_relationship_id is null
  );

alter policy sermon_evaluations_delete_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and mentor_relationship_id is null
  );

alter policy sermon_evaluations_insert_own
  on public.sermon_evaluations
  with check (
    owner_id = auth.uid()
    and mentor_relationship_id is null
  );
