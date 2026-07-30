-- A mentored submission produces a debrief and an evaluation off one
-- sermon version, both starting pending. Keying the partial unique index
-- on sermon_version_id alone rejected every mentored submission.
-- Keying on report_mode too keeps the guard meaningful (two in-flight
-- diagnostics on one version stays blocked) while permitting the
-- legitimate pair. Side effect: an unmentored user can now also have a
-- diagnostic and a debrief in flight simultaneously on the same version;
-- that is a behavior change on the ordinary path and is considered
-- acceptable.

drop index if exists public.sermon_evaluations_one_active_per_version_idx;

create unique index sermon_evaluations_one_active_per_version_idx
  on public.sermon_evaluations (sermon_version_id, report_mode)
  where status = any (array['pending', 'running']);
