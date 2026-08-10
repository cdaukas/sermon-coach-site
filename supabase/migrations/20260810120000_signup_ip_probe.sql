-- Throwaway probe for whether server actions see client IP headers.
-- Drop after fix/signup-rate-limit design is decided.

create table if not exists public.signup_ip_probe (
  id uuid primary key default gen_random_uuid(),
  forwarded_for text,
  real_ip text,
  vercel_ip text,
  header_names text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.signup_ip_probe enable row level security;

revoke all on public.signup_ip_probe from anon, authenticated;
