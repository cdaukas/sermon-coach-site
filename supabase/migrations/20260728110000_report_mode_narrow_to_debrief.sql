-- Backfill legacy coaching rows, then narrow report_mode to diagnostic and debrief.

update public.sermon_evaluations
set report_mode = 'debrief'
where report_mode = 'coaching';

alter table public.sermon_evaluations
  drop constraint sermon_evaluations_report_mode_check;

alter table public.sermon_evaluations
  add constraint sermon_evaluations_report_mode_check
  check (
    report_mode = any (array['diagnostic', 'debrief'])
  );

comment on constraint sermon_evaluations_report_mode_check
  on public.sermon_evaluations is
  'Legacy report_mode value coaching was renamed to debrief and backfilled 2026-07-28.';

alter policy sermon_evaluations_select_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and (mentor_relationship_id is null
         or report_mode = 'debrief')
  );
