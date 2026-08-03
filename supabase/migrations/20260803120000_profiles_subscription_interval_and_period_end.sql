-- Additive subscription billing period metadata for profiles.
-- Nullable, no defaults, no CHECK: existing rows stay null/unaffected.

alter table public.profiles
  add column if not exists subscription_interval text;

comment on column public.profiles.subscription_interval is
  'Stripe price recurring interval for the active Coach subscription (e.g. month, year). Set by subscription webhooks; no CHECK so Stripe vocabulary can change.';

alter table public.profiles
  add column if not exists current_period_end timestamptz;

comment on column public.profiles.current_period_end is
  'End of the current Stripe billing period for the subscription. Set by activation webhooks; left in place on deactivation for last-known period end.';
