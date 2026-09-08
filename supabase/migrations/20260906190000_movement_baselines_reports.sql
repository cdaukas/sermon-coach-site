-- Movement baselines (locked diagnostic) and movement reports.
-- Baseline stores the exact sermon ids and counts from the diagnostic /
-- prep-card generation. Reports compare only sermons preached since.

create table if not exists public.movement_baselines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  theme_id text not null
    check (theme_id in ('ask', 'christ', 'room', 'delight')),
  focus_measure_ids integer[] not null,
  baseline_counts jsonb not null,
  sermon_ids uuid[] not null,
  sample_label text,
  prep_card_id uuid references public.prep_cards (id) on delete set null,
  generated_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists movement_baselines_user_open_idx
  on public.movement_baselines (user_id, generated_at desc)
  where closed_at is null;

create table if not exists public.movement_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  baseline_id uuid not null references public.movement_baselines (id)
    on delete cascade,
  theme_id text not null
    check (theme_id in ('ask', 'christ', 'room', 'delight')),
  generated_at timestamptz not null default now(),
  comparison_sample_size integer not null check (comparison_sample_size >= 0),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists movement_reports_user_generated_idx
  on public.movement_reports (user_id, generated_at desc);

create index if not exists movement_reports_baseline_idx
  on public.movement_reports (baseline_id, generated_at desc);

alter table public.movement_baselines enable row level security;
alter table public.movement_reports enable row level security;

create policy movement_baselines_select_own
  on public.movement_baselines for select
  using (auth.uid() = user_id);

create policy movement_reports_select_own
  on public.movement_reports for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.movement_baselines from anon, authenticated;
revoke insert, update, delete on public.movement_reports from anon, authenticated;
grant select on public.movement_baselines to authenticated;
grant select on public.movement_reports to authenticated;
grant all on public.movement_baselines to service_role;
grant all on public.movement_reports to service_role;

comment on table public.movement_baselines is
  'Locked diagnostic sample for a theme work quarter. Sermon ids and counts are frozen at generation.';
comment on table public.movement_reports is
  'Movement report snapshots. Compares baseline set against sermons preached since; never pools.';
