-- Rate-limit log for YouTube transcript fetches (10s cooldown + 20/day per user).

create table public.youtube_transcript_fetches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fetched_at  timestamptz not null default now()
);

create index youtube_transcript_fetches_user_fetched_at_idx
  on public.youtube_transcript_fetches (user_id, fetched_at desc);

comment on table public.youtube_transcript_fetches is
  'Audit log for YouTube caption fetches; used for per-user cooldown and daily caps.';

alter table public.youtube_transcript_fetches enable row level security;

-- No client policies: only service role reads/writes this table.
