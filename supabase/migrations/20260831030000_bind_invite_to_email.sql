-- Bind emailed invites to invite_email_to. Copy-link (null) stays unbound.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: verify pg_get_functiondef, then
--   supabase migration repair --status applied 20260831030000

create or replace function public.accept_mentor_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_token text := nullif(btrim(coalesce(p_token, '')), '');
  v_row   public.mentor_relationships%rowtype;
  v_capacity int;
  v_used int;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'not_authenticated',
      'relationship_id', null
    );
  end if;

  if v_token is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used',
      'relationship_id', null
    );
  end if;

  select *
  into v_row
  from public.mentor_relationships
  where invite_token = v_token
  for update;

  if not found or v_row.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used',
      'relationship_id', null
    );
  end if;

  if v_row.mentor_id = auth.uid() then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'self_invite',
      'relationship_id', null
    );
  end if;

  -- Emailed invites only. Null invite_email_to is copy-link and stays unbound.
  if v_row.invite_email_to is not null then
    if lower(btrim(v_row.invite_email_to)) is distinct from
       lower(btrim((select email from auth.users where id = auth.uid()))) then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'email_mismatch',
        'relationship_id', null
      );
    end if;
  end if;

  if exists (
    select 1
    from public.mentor_relationships
    where mentee_id = auth.uid()
      and status = 'active'
  ) then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'already_mentored',
      'relationship_id', null
    );
  end if;

  v_capacity := public.mentor_seat_capacity_for(v_row.mentor_id, v_row.seat_type);
  v_used := public.mentor_seat_type_used(v_row.mentor_id, v_row.seat_type);
  -- Pending row is included in v_used; over capacity (e.g. cancel left this token) refuses.
  if v_used > v_capacity then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'no_seat_capacity',
      'relationship_id', null
    );
  end if;

  begin
    update public.mentor_relationships
    set
      mentee_id = auth.uid(),
      status = 'active',
      period_started_at = now(),
      accepted_at = now()
    where id = v_row.id
      and status = 'pending';

    if not found then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'invalid_or_used',
        'relationship_id', null
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'error_code', null,
      'relationship_id', v_row.id
    );
  exception
    when unique_violation then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'already_mentored',
        'relationship_id', null
      );
  end;
end;
$function$;

comment on function public.accept_mentor_invite(text) is
  'Accepts a pending invite for the signed-in mentee. When invite_email_to is set, the caller''s auth.users.email must match (raw lowercase); null invite_email_to is copy-link and stays unbound. Refuses no_seat_capacity when the mentor''s pending+active of that seat type exceeds purchased(+comp). Token alone is not trustable after cancel.';
