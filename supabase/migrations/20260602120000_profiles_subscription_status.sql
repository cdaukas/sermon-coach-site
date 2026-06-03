-- Paid access gate: evaluations require subscription_status = 'active'.
-- Stripe webhooks can set this later; until then, update profiles manually.

alter table public.profiles
  add column if not exists subscription_status text not null default 'inactive';

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('active', 'inactive'));
