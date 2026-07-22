-- Anonymous Sketch rate-limit events. Service role only. Keyed by IP.

create table if not exists public.sketch_rate_events (
  id          uuid primary key default gen_random_uuid(),
  ip          text not null,
  action      text not null check (action in ('run', 'save')),
  created_at  timestamptz not null default now()
);

create index if not exists sketch_rate_events_ip_action_created_idx
  on public.sketch_rate_events (ip, action, created_at);

create index if not exists sketch_rate_events_action_created_idx
  on public.sketch_rate_events (action, created_at);

alter table public.sketch_rate_events enable row level security;

revoke all on public.sketch_rate_events from anon, authenticated;
