create or replace function public.claim_mentored_evaluation(
  p_diagnostic_id uuid,
  p_debrief_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_relationship_id uuid;
  v_version_id uuid;
  v_now timestamptz := now();
  v_debrief_rows int;
begin
  update public.sermon_evaluations
  set status = 'running', started_at = v_now
  where id = p_diagnostic_id
    and status = 'pending'
    and report_mode = 'diagnostic'
    and mentor_relationship_id is not null
  returning mentor_relationship_id, sermon_version_id
  into v_relationship_id, v_version_id;

  if v_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'diagnostic_not_claimable');
  end if;

  update public.sermon_evaluations
  set status = 'running', started_at = v_now
  where id = p_debrief_id
    and status = 'pending'
    and report_mode = 'debrief'
    and mentor_relationship_id = v_relationship_id
    and sermon_version_id = v_version_id;
  get diagnostics v_debrief_rows = row_count;

  if v_debrief_rows <> 1 then
    raise exception 'debrief_not_claimable: rows=%', v_debrief_rows;
  end if;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'diagnostic_id', p_diagnostic_id,
    'debrief_id', p_debrief_id
  );
end;
$function$;

revoke all on function public.claim_mentored_evaluation(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_mentored_evaluation(uuid, uuid)
  to service_role;

comment on function public.claim_mentored_evaluation(uuid, uuid) is
  'Atomic CAS claim for a mentored pair. The diagnostic UPDATE is the claim: '
  'WHERE status = pending means one winner, and zero rows returns '
  'diagnostic_not_claimable rather than raising, so the loser exits quietly. '
  'The debrief row moves to running in the same transaction after verifying '
  'same relationship and same version. A mismatch raises, rolling back the '
  'diagnostic claim so the pair stays pending rather than half-claimed. '
  'Needed because complete_mentored_evaluation requires both rows at running. '
  'service_role only.';
