create or replace function public.refresh_evaluation_period_if_needed(p_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_period_start date;
  v_period_end timestamptz;
begin
  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
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
$function$;

create or replace function public.consume_evaluation_credit(p_user_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_free int;
  v_status text;
begin
  if auth.uid() is not null and auth.uid() is distinct from p_user_id then
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
$function$;

revoke all on function public.consume_evaluation_credit(uuid) from anon;
revoke all on function public.refresh_evaluation_period_if_needed(uuid) from anon;

comment on function public.consume_evaluation_credit(uuid) is
  'Consumes one evaluation credit: free first, then an active subscription '
  'period increment. The guard permits a null auth.uid(), which is the trusted '
  'server-side worker calling through the admin client, and still rejects a '
  'signed-in user acting on another user id. The original guard rejected null '
  'and broke credit consumption for every free and subscription evaluation on '
  '2026-07-30; see PR #188. anon is revoked because a null auth.uid() from an '
  'unauthenticated caller would otherwise pass the guard.';

comment on function public.refresh_evaluation_period_if_needed(uuid) is
  'Resets the monthly evaluation counter when the period has rolled. Same guard '
  'change and same reason as consume_evaluation_credit, which calls this and '
  'therefore hit the identical failure. Known gap: a null '
  'evaluations_period_start makes v_period_end null, so the reset never fires. '
  'Tracked separately.';
