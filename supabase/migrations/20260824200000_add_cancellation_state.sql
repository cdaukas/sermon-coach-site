-- Cancellation and tenure fields on profiles.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260824200000

alter table public.profiles
  add column if not exists subscription_started_at timestamptz;

alter table public.profiles
  add column if not exists canceled_at timestamptz;

alter table public.profiles
  add column if not exists cancellation_effective_at timestamptz;

alter table public.profiles
  add column if not exists cancellation_source text;

alter table public.profiles
  add column if not exists cancellation_reason text;

alter table public.profiles
  add column if not exists cancellation_comment text;

alter table public.profiles
  add column if not exists is_comped boolean not null default false;

alter table public.profiles
  add column if not exists comp_reason text;

alter table public.profiles
  drop constraint if exists profiles_cancellation_source_check;

alter table public.profiles
  add constraint profiles_cancellation_source_check
  check (
    cancellation_source is null
    or cancellation_source in ('voluntary', 'payment_failure', 'admin')
  );

comment on column public.profiles.subscription_started_at is
  'Stripe subscription start_date. Set once; never overwritten. Distinct from profiles.created_at.';

comment on column public.profiles.canceled_at is
  'When the subscriber decided to cancel (Stripe canceled_at). Behavioral date.';

comment on column public.profiles.cancellation_effective_at is
  'When access actually ends (Stripe current_period_end). Churn date.';

comment on column public.profiles.cancellation_source is
  'voluntary | payment_failure | admin. Nullable. No default.';

comment on column public.profiles.cancellation_reason is
  'Stripe cancellation_details.reason.';

comment on column public.profiles.cancellation_comment is
  'Stripe cancellation_details.comment.';

comment on column public.profiles.is_comped is
  'Permanent complimentary Coach access. Set by hand. Default false.';

comment on column public.profiles.comp_reason is
  'Why this profile is comped. Set by hand.';
