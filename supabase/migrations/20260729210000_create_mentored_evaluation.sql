CREATE OR REPLACE FUNCTION public.create_mentored_evaluation(p_sermon_version_id uuid, p_prompt_version text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_relationship_id uuid;
  v_used int;
  v_diagnostic_id uuid;
  v_debrief_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_authenticated');
  end if;
  if nullif(btrim(coalesce(p_prompt_version, '')), '') is null then
    return jsonb_build_object('ok', false, 'error_code', 'missing_prompt_version');
  end if;
  select id into v_relationship_id
  from public.mentor_relationships
  where mentee_id = v_uid
    and status = 'active';
  if v_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'no_active_relationship');
  end if;
  if not exists (
    select 1
    from public.sermon_versions v
    join public.sermons s on s.id = v.sermon_id
    where v.id = p_sermon_version_id
      and s.user_id = v_uid
  ) then
    return jsonb_build_object('ok', false, 'error_code', 'version_not_owned');
  end if;
  select count(*) into v_used
  from public.sermon_evaluations
  where mentor_relationship_id = v_relationship_id
    and report_mode = 'diagnostic'
    and created_at >= date_trunc('month', now());
  if v_used >= 4 then
    return jsonb_build_object('ok', false, 'error_code', 'allotment_exhausted', 'used', v_used);
  end if;
  if exists (
    select 1 from public.sermon_evaluations
    where sermon_version_id = p_sermon_version_id
      and status in ('pending', 'running')
  ) then
    return jsonb_build_object('ok', false, 'error_code', 'already_in_flight');
  end if;
  insert into public.sermon_evaluations
    (mentor_relationship_id, sermon_version_id, status, prompt_version,
     report_mode, credit_source)
  values
    (v_relationship_id, p_sermon_version_id, 'pending', p_prompt_version,
     'diagnostic', 'mentor_seat')
  returning id into v_diagnostic_id;
  insert into public.sermon_evaluations
    (mentor_relationship_id, sermon_version_id, status, prompt_version,
     report_mode, credit_source)
  values
    (v_relationship_id, p_sermon_version_id, 'pending', p_prompt_version,
     'debrief', 'mentor_seat')
  returning id into v_debrief_id;
  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'relationship_id', v_relationship_id,
    'diagnostic_id', v_diagnostic_id,
    'debrief_id', v_debrief_id,
    'used_after', v_used + 1
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error_code', 'already_in_flight');
end;
$function$;

revoke all on function public.create_mentored_evaluation(uuid, text)
  from public, anon;
grant execute on function public.create_mentored_evaluation(uuid, text)
  to authenticated;

comment on function public.create_mentored_evaluation(uuid, text) is
  'One mentored submission, one credit, two rows: a diagnostic row and a debrief row, both credit_source mentor_seat, both pending. Entitlement is a count of diagnostic rows for the relationship since the start of the calendar month, capped at 4; nothing is incremented and nothing needs resetting. Does not branch on seat_type: both seats produce both rows, and the hold lives in sermon_evaluations_select_own via relationship_holds_evaluations, which is true only for debrief seats. Verifies the version belongs to the caller because resolve_owner_id derives owner_id from it. SECURITY DEFINER because sermon_evaluations_insert_own requires mentor_relationship_id null. Returns jsonb with an error_code contract matching accept_mentor_invite and does not raise: the unique_violation handler covers the check-then-insert race on sermon_evaluations_one_active_per_version_idx.';
