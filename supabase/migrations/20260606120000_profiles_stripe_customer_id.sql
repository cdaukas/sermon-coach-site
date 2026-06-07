-- Stripe customer linkage for subscription webhook activation.

alter table public.profiles
  add column if not exists stripe_customer_id text;

comment on column public.profiles.stripe_customer_id is
  'Stripe customer ID (cus_…). Set by subscription webhook on first email match; used for subsequent events.';

create unique index if not exists profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Email fallback lookup: profiles.id = auth.users.id (service role only).
create or replace function public.find_profile_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select p.id
  from public.profiles p
  inner join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_profile_id_by_email(text) from public;
grant execute on function public.find_profile_id_by_email(text) to service_role;
