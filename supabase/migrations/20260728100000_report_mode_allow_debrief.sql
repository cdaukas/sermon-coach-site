-- Transitional: allow debrief alongside legacy coaching until app deploy
-- and backfill; then narrow to diagnostic and debrief only.

alter table public.sermon_evaluations
  drop constraint sermon_evaluations_report_mode_check;

alter table public.sermon_evaluations
  add constraint sermon_evaluations_report_mode_check
  check (
    report_mode = any (array['diagnostic', 'coaching', 'debrief'])
  );

comment on constraint sermon_evaluations_report_mode_check
  on public.sermon_evaluations is
  'Transitional: allows legacy coaching until the app deploys and existing coaching rows are backfilled to debrief; then narrows to diagnostic and debrief only.';

alter policy sermon_evaluations_select_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and (mentor_relationship_id is null
         or report_mode in ('coaching', 'debrief'))
  );
