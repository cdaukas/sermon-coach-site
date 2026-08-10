-- Signup per-IP rate events. Service role only.
-- Drop temporary probe table from fix/signup-ip probe.

create table if not exists public.signup_rate_events (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists signup_rate_events_ip_created_idx
  on public.signup_rate_events (ip, created_at);

alter table public.signup_rate_events enable row level security;

revoke all on public.signup_rate_events from anon, authenticated;

drop table if exists public.signup_ip_probe;
