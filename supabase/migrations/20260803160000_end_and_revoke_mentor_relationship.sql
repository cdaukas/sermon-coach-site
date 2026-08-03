-- End an active mentoring relationship (either party) and revoke a pending invite (mentor only).
-- Applied by hand then repaired; do not db push while migration history is out of sync.

CREATE OR REPLACE FUNCTION public.end_mentor_relationship(p_relationship_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_row public.mentor_relationships%rowtype;
  v_now timestamptz := now();
  v_released int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_authenticated');
  end if;

  if p_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_found');
  end if;

  select *
  into v_row
  from public.mentor_relationships
  where id = p_relationship_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'not_found');
  end if;

  if v_row.mentor_id is distinct from v_uid
     and v_row.mentee_id is distinct from v_uid then
    return jsonb_build_object('ok', false, 'error_code', 'not_a_party');
  end if;

  if v_row.status is distinct from 'active' then
    return jsonb_build_object('ok', false, 'error_code', 'not_active');
  end if;

  update public.mentor_relationships
  set
    status = 'ended',
    ended_at = v_now
  where id = v_row.id
    and status = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'not_active');
  end if;

  -- Write-once safe: only rows still held (released_to_mentee_at is null).
  update public.sermon_evaluations
  set released_to_mentee_at = v_now
  where mentor_relationship_id = v_row.id
    and report_mode = 'diagnostic'
    and status = 'complete'
    and released_to_mentee_at is null;

  get diagnostics v_released = row_count;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'relationship_id', v_row.id,
    'ended_at', v_now,
    'released_count', v_released
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_mentor_invite(p_relationship_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_row public.mentor_relationships%rowtype;
  v_now timestamptz := now();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_authenticated');
  end if;

  if p_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_found');
  end if;

  select *
  into v_row
  from public.mentor_relationships
  where id = p_relationship_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'not_found');
  end if;

  if v_row.mentor_id is distinct from v_uid then
    return jsonb_build_object('ok', false, 'error_code', 'not_your_invite');
  end if;

  if v_row.status is distinct from 'pending' then
    return jsonb_build_object('ok', false, 'error_code', 'not_pending');
  end if;

  update public.mentor_relationships
  set
    status = 'revoked',
    ended_at = v_now
  where id = v_row.id
    and status = 'pending';

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'not_pending');
  end if;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'relationship_id', v_row.id,
    'ended_at', v_now
  );
end;
$function$;

grant execute on function public.end_mentor_relationship(uuid) to authenticated, postgres, service_role;
grant execute on function public.revoke_mentor_invite(uuid) to authenticated, postgres, service_role;
