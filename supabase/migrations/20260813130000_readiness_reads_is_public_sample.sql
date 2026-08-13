-- Public sample Sketch flag.
-- Exactly one row may be true (partial unique index). Default false.
-- Public route reads via service role filtered on this flag; no anon RLS change.

alter table public.readiness_reads
  add column if not exists is_public_sample boolean not null default false;

comment on column public.readiness_reads.is_public_sample is
  'When true, this Sketch read may be rendered on the unauthenticated public sample page. At most one row may be true.';

create unique index if not exists readiness_reads_one_public_sample_idx
  on public.readiness_reads ((true))
  where is_public_sample;

-- Flag the operator-owned Hebrews 3 find-mode sample.
update public.readiness_reads
set is_public_sample = true
where id = '79096f0e-0f0d-49c7-a7ed-b525d7e0e23c'
  and is_public_sample = false;
