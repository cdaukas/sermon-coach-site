alter table public.profiles
  add column if not exists onboarding_nudge_sent_at timestamptz;

comment on column public.profiles.onboarding_nudge_sent_at is
  'When the 3-day onboarding nudge email was sent; idempotent guard against duplicate nudges.';
