-- Public sample evaluation flag.
-- Exactly one row may be true (partial unique index). Default false.
-- Public route reads via service role filtered on this flag; no anon RLS change.

alter table public.sermon_evaluations
  add column if not exists is_public_sample boolean not null default false;

comment on column public.sermon_evaluations.is_public_sample is
  'When true, this evaluation may be rendered on the unauthenticated public sample page. At most one row may be true.';

create unique index if not exists sermon_evaluations_one_public_sample_idx
  on public.sermon_evaluations ((true))
  where is_public_sample;

-- Flag the operator-owned Strong sample (The House God Built).
update public.sermon_evaluations
set is_public_sample = true
where id = '9e8c09e7-1feb-4506-8bc0-2e3856792a79'
  and is_public_sample = false;
