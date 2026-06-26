-- Lifecycle email guards on profiles (welcome + first-eval feedback, referral attribution).

alter table public.profiles
  add column if not exists first_evaluation_at timestamptz;

alter table public.profiles
  add column if not exists welcome_sent_at timestamptz;

alter table public.profiles
  add column if not exists referral_source text;

comment on column public.profiles.first_evaluation_at is
  'Timestamp of the pastor''s first completed evaluation; idempotent guard for first-eval feedback email. Distinct from last_evaluation_at.';

comment on column public.profiles.welcome_sent_at is
  'When the welcome lifecycle email was sent; idempotent guard against duplicate sends.';

comment on column public.profiles.referral_source is
  'Bitly sender-attribution source captured at signup.';
