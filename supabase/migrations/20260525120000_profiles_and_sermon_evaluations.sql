-- Step 6.1: profiles (quota stub) + sermon_evaluations with RLS

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                           uuid primary key references auth.users (id) on delete cascade,
  plan_tier                    text not null default 'coach'
                               check (plan_tier in ('coach', 'coach_plus', 'cohort')),
  evaluations_used_this_period int not null default 0
                               check (evaluations_used_this_period >= 0),
  evaluations_period_start     date not null default (date_trunc('month', now())::date),
  last_evaluation_at           timestamptz,
  created_at                   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- New signups get a profile row automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill profiles for users created before this migration.
insert into public.profiles (id)
select id
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- sermon_evaluations
-- ---------------------------------------------------------------------------

create table public.sermon_evaluations (
  id                uuid primary key default gen_random_uuid(),
  sermon_version_id uuid not null references public.sermon_versions (id) on delete cascade,
  status            text not null default 'pending'
                    check (status in ('pending', 'running', 'complete', 'failed')),
  error_message     text,
  model             text,
  prompt_version    text not null default 'v1',
  result            jsonb,
  overall_score     int check (overall_score is null or (overall_score between 0 and 100)),
  score_band        text,
  input_tokens      int,
  output_tokens     int,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  completed_at      timestamptz
);

-- Only one in-flight evaluation per manuscript version.
create unique index sermon_evaluations_one_active_per_version_idx
  on public.sermon_evaluations (sermon_version_id)
  where status in ('pending', 'running');

create index sermon_evaluations_version_created_idx
  on public.sermon_evaluations (sermon_version_id, created_at desc);

create index sermon_evaluations_status_idx
  on public.sermon_evaluations (status)
  where status in ('pending', 'running');

alter table public.sermon_evaluations enable row level security;

create policy "sermon_evaluations_select_own"
  on public.sermon_evaluations
  for select
  using (
    exists (
      select 1
      from public.sermon_versions v
      join public.sermons s on s.id = v.sermon_id
      where v.id = sermon_evaluations.sermon_version_id
        and s.user_id = auth.uid()
    )
  );

create policy "sermon_evaluations_insert_own"
  on public.sermon_evaluations
  for insert
  with check (
    exists (
      select 1
      from public.sermon_versions v
      join public.sermons s on s.id = v.sermon_id
      where v.id = sermon_evaluations.sermon_version_id
        and s.user_id = auth.uid()
    )
  );

create policy "sermon_evaluations_update_own"
  on public.sermon_evaluations
  for update
  using (
    exists (
      select 1
      from public.sermon_versions v
      join public.sermons s on s.id = v.sermon_id
      where v.id = sermon_evaluations.sermon_version_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sermon_versions v
      join public.sermons s on s.id = v.sermon_id
      where v.id = sermon_evaluations.sermon_version_id
        and s.user_id = auth.uid()
    )
  );

create policy "sermon_evaluations_delete_own"
  on public.sermon_evaluations
  for delete
  using (
    exists (
      select 1
      from public.sermon_versions v
      join public.sermons s on s.id = v.sermon_id
      where v.id = sermon_evaluations.sermon_version_id
        and s.user_id = auth.uid()
    )
  );
