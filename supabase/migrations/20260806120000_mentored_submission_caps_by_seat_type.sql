-- Apprentice (debrief) monthly allotment is 2; Colleague (evaluation) is 4.
-- Both still generate diagnostic + debrief rows; only the refuse threshold branches.
-- Calendar month (UTC) unchanged. Must ship before purchasable seats go live.

CREATE OR REPLACE FUNCTION public.create_mentored_evaluation(
  p_sermon_version_id uuid,
  p_prompt_version text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_relationship_id uuid;
  v_seat_type text;
  v_limit int;
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

  select id, seat_type
  into v_relationship_id, v_seat_type
  from public.mentor_relationships
  where mentee_id = v_uid
    and status = 'active';

  if v_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'no_active_relationship');
  end if;

  v_limit := case v_seat_type
    when 'debrief' then 2
    when 'evaluation' then 4
    else null
  end;

  if v_limit is null then
    return jsonb_build_object('ok', false, 'error_code', 'invalid_seat_type');
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

  select count(*)::int into v_used
  from public.sermon_evaluations
  where mentor_relationship_id = v_relationship_id
    and report_mode = 'diagnostic'
    and created_at >= date_trunc('month', now());

  if v_used >= v_limit then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'allotment_exhausted',
      'used', v_used,
      'limit', v_limit
    );
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
    'used_after', v_used + 1,
    'limit', v_limit
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error_code', 'already_in_flight');
end;
$function$;

comment on function public.create_mentored_evaluation(uuid, text) is
  'One mentored submission, one credit, two rows: a diagnostic row and a debrief row, both credit_source mentor_seat, both pending. Entitlement is a count of diagnostic rows for the relationship since the start of the calendar month (UTC). Cap is 2 for seat_type=debrief (Apprentice) and 4 for seat_type=evaluation (Colleague). Generation does not branch on seat_type. Hold is relationship_holds_evaluations / released_to_mentee_at on debrief seats only.';
