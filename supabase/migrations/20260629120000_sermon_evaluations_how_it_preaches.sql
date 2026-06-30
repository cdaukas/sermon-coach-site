-- How It Preaches craft read (separate generation path; demo account only via app flag).

alter table public.sermon_evaluations
  add column how_it_preaches jsonb;

comment on column public.sermon_evaluations.how_it_preaches is
  'Optional craft-read movements (The Open through The Landing); null when feature flag is off or before generation.';
