-- Prep card snapshots. One row per generation per user (latest retained;
-- history kept by inserting new rows; UI reads newest).

create table if not exists public.prep_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generated_at timestamptz not null default now(),
  sample_size integer not null check (sample_size >= 0),
  source_format text not null
    check (source_format in ('manuscript', 'transcript', 'mixed', 'unknown')),
  ranked_measure_count integer not null check (ranked_measure_count >= 0),
  pool_note text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists prep_cards_user_generated_idx
  on public.prep_cards (user_id, generated_at desc);

alter table public.prep_cards enable row level security;

create policy prep_cards_select_own
  on public.prep_cards for select
  using (auth.uid() = user_id);

-- Writes go through service role / server actions only.
revoke insert, update, delete on public.prep_cards from anon, authenticated;
grant select on public.prep_cards to authenticated;
grant all on public.prep_cards to service_role;

comment on table public.prep_cards is
  'Quarterly prep card snapshots. Counts, ranking, and selected ends in snapshot jsonb. Model writes nothing on the card.';
