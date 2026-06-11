create or replace function public.consume_pack_credit(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant_id uuid;
begin
  -- Lock the soonest-expiring live grant with credits remaining.
  -- FOR UPDATE SKIP LOCKED so concurrent consumes pick different rows
  -- instead of blocking, which is correct for a shared cohort pool.
  select id into v_grant_id
  from public.eval_credit_grants
  where user_id = p_user_id
    and quantity_remaining > 0
    and expires_at > now()
  order by expires_at asc
  for update skip locked
  limit 1;

  if v_grant_id is null then
    return null; -- no live credit available
  end if;

  update public.eval_credit_grants
  set quantity_remaining = quantity_remaining - 1
  where id = v_grant_id;

  return v_grant_id;
end;
$$;

revoke all on function public.consume_pack_credit(uuid) from public, anon, authenticated;
grant execute on function public.consume_pack_credit(uuid) to service_role;
