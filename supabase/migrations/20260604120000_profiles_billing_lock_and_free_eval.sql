-- Lock billing columns on profiles (no user UPDATE), then grant one free eval on new signups only.

-- ---------------------------------------------------------------------------
-- 1. SECURITY: revoke direct client writes to profiles
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_update_own" on public.profiles;

revoke update on table public.profiles from authenticated;
revoke update on table public.profiles from anon;

-- ---------------------------------------------------------------------------
-- 2. Free-first credit: existing rows stay 0; new signups default to 1
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists free_evaluations_remaining int not null default 0
  check (free_evaluations_remaining >= 0);

comment on column public.profiles.free_evaluations_remaining is
  'One-time free evaluations for new accounts. Existing users remain 0; new inserts default to 1.';

alter table public.profiles
  alter column free_evaluations_remaining set default 1;

-- ---------------------------------------------------------------------------
-- 3. SECURITY DEFINER: period refresh + credit consumption (RPC only)
-- ---------------------------------------------------------------------------

create or replace function public.refresh_evaluation_period_if_needed(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start date;
  v_period_end timestamptz;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not allowed';
  end if;

  select evaluations_period_start
  into v_period_start
  from public.profiles
  where id = p_user_id;

  if not found then
    raise exception 'profile not found';
  end if;

  v_period_end := (v_period_start::timestamptz at time zone 'UTC') + interval '1 month';

  if now() >= v_period_end then
    update public.profiles
    set
      evaluations_used_this_period = 0,
      evaluations_period_start = date_trunc('month', now() at time zone 'UTC')::date
    where id = p_user_id;
  end if;
end;
$$;

create or replace function public.consume_evaluation_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free int;
  v_status text;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'not allowed';
  end if;

  perform public.refresh_evaluation_period_if_needed(p_user_id);

  select free_evaluations_remaining, subscription_status
  into v_free, v_status
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_free > 0 then
    update public.profiles
    set
      free_evaluations_remaining = free_evaluations_remaining - 1,
      last_evaluation_at = now()
    where id = p_user_id;
    return;
  end if;

  if v_status = 'active' then
    update public.profiles
    set
      evaluations_used_this_period = evaluations_used_this_period + 1,
      last_evaluation_at = now()
    where id = p_user_id;
    return;
  end if;

  raise exception 'no evaluation credit to consume';
end;
$$;

revoke all on function public.refresh_evaluation_period_if_needed(uuid) from public;
revoke all on function public.consume_evaluation_credit(uuid) from public;

grant execute on function public.refresh_evaluation_period_if_needed(uuid) to authenticated;
grant execute on function public.consume_evaluation_credit(uuid) to authenticated;
