create or replace function public.complete_mentored_evaluation(
  p_diagnostic_id uuid,
  p_debrief_id uuid,
  p_model text,
  p_result jsonb,
  p_overall_score int,
  p_score_band text,
  p_coaching_narrative jsonb,
  p_how_it_preaches jsonb,
  p_input_tokens int,
  p_output_tokens int
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
  v_diag_rows int;
  v_debrief_rows int;
begin
  select d.mentor_relationship_id, d.sermon_version_id
    into v_relationship_id, v_version_id
  from public.sermon_evaluations d
  where d.id = p_diagnostic_id
    and d.report_mode = 'diagnostic'
    and d.status = 'running'
    and d.mentor_relationship_id is not null;

  if v_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'diagnostic_not_claimable');
  end if;

  if not exists (
    select 1
    from public.sermon_evaluations b
    where b.id = p_debrief_id
      and b.report_mode = 'debrief'
      and b.status = 'running'
      and b.mentor_relationship_id = v_relationship_id
      and b.sermon_version_id = v_version_id
  ) then
    return jsonb_build_object('ok', false, 'error_code', 'debrief_not_paired');
  end if;

  update public.sermon_evaluations
  set status = 'complete',
      model = p_model,
      result = p_result,
      overall_score = p_overall_score,
      score_band = p_score_band,
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      completed_at = v_now
  where id = p_diagnostic_id
    and status = 'running';
  get diagnostics v_diag_rows = row_count;

  update public.sermon_evaluations
  set status = 'complete',
      model = p_model,
      coaching_narrative = p_coaching_narrative,
      how_it_preaches = p_how_it_preaches,
      completed_at = v_now
  where id = p_debrief_id
    and status = 'running';
  get diagnostics v_debrief_rows = row_count;

  if v_diag_rows <> 1 or v_debrief_rows <> 1 then
    raise exception
      'pair_write_mismatch: diagnostic=% debrief=%',
      v_diag_rows, v_debrief_rows;
  end if;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'diagnostic_id', p_diagnostic_id,
    'debrief_id', p_debrief_id,
    'completed_at', v_now
  );
end;
$function$;

create or replace function public.fail_mentored_evaluation(
  p_diagnostic_id uuid,
  p_debrief_id uuid,
  p_error_message text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_now timestamptz := now();
  v_rows int;
begin
  update public.sermon_evaluations
  set status = 'failed',
      error_message = p_error_message,
      completed_at = v_now
  where id in (p_diagnostic_id, p_debrief_id)
    and status in ('pending', 'running');
  get diagnostics v_rows = row_count;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'rows_failed', v_rows
  );
end;
$function$;

revoke all on function public.complete_mentored_evaluation(uuid, uuid, text, jsonb, int, text, jsonb, jsonb, int, int)
  from public, anon, authenticated;
grant execute on function public.complete_mentored_evaluation(uuid, uuid, text, jsonb, int, text, jsonb, jsonb, int, int)
  to service_role;

revoke all on function public.fail_mentored_evaluation(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.fail_mentored_evaluation(uuid, uuid, text)
  to service_role;

comment on function public.complete_mentored_evaluation(uuid, uuid, text, jsonb, int, text, jsonb, jsonb, int, int) is
  'Terminal write for a mentored pair, atomic because a plpgsql function body is a single transaction. Splits one pipeline run across two rows: scores and token totals to the diagnostic row, coaching_narrative and how_it_preaches to the debrief row. The debrief row keeps result, overall_score, and score_band null, which sermon_evaluations_mentored_coaching_payload_check enforces. Both UPDATEs require status running, so a late or duplicate writer cannot clobber a terminal row. Returns jsonb with an error_code contract matching create_mentored_evaluation for expected failures; raises only on pair_write_mismatch, which is unreachable given the guards and must roll back rather than leave a half-written pair. service_role only: the mentee calls create_mentored_evaluation, never this.';

comment on function public.fail_mentored_evaluation(uuid, uuid, text) is
  'Terminal failure write for a mentored pair. Deliberately permissive: no pairing or report_mode checks, and it accepts rows in pending as well as running, because failure handling that can itself fail is how rows get stuck forever. Always returns ok true with a rows_failed count. service_role only.';
