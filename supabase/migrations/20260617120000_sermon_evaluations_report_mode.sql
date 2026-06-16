-- Render mode for evaluation reports: diagnostic (default) or coaching.

alter table public.sermon_evaluations
  add column report_mode text not null default 'diagnostic'
  check (report_mode in ('diagnostic', 'coaching'));

comment on column public.sermon_evaluations.report_mode is
  'Which report render mode to use for this evaluation (diagnostic or coaching).';

-- Existing rows receive diagnostic via the column default at add time.
