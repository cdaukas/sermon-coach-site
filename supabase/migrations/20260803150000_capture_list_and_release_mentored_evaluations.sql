-- These two functions were applied by hand and are being captured retroactively on 2026-08-03.
-- The bodies below are verbatim from pg_get_functiondef against production.

CREATE OR REPLACE FUNCTION public.list_mentored_evaluations_for_mentor()
 RETURNS TABLE(evaluation_id uuid, relationship_id uuid, seat_type text, mentee_id uuid, mentee_email text, sermon_id uuid, sermon_title text, primary_passage text, status text, overall_score integer, score_band text, released_to_mentee_at timestamp with time zone, completed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select
    se.id,
    mr.id,
    mr.seat_type,
    mr.mentee_id,
    u.email::text,
    s.id,
    s.title,
    s.primary_passage,
    se.status,
    se.overall_score,
    se.score_band,
    se.released_to_mentee_at,
    se.completed_at,
    se.created_at
  from public.sermon_evaluations se
  join public.mentor_relationships mr on mr.id = se.mentor_relationship_id
  join public.sermon_versions v on v.id = se.sermon_version_id
  join public.sermons s on s.id = v.sermon_id
  join auth.users u on u.id = mr.mentee_id
  where mr.mentor_id = auth.uid()
    and mr.status = 'active'
    and se.report_mode = 'diagnostic'
  order by se.created_at desc;
$function$;

CREATE OR REPLACE FUNCTION public.release_mentored_evaluation(p_evaluation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_relationship_id uuid;
  v_now timestamptz := now();
  v_rows int;
begin
  select se.mentor_relationship_id
  into v_relationship_id
  from public.sermon_evaluations se
  where se.id = p_evaluation_id
    and se.report_mode = 'diagnostic'
    and se.mentor_relationship_id is not null;

  if v_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_releasable');
  end if;

  if not public.is_mentor_of_relationship(v_relationship_id) then
    return jsonb_build_object('ok', false, 'error_code', 'not_your_mentee');
  end if;

  if not public.relationship_holds_evaluations(v_relationship_id) then
    return jsonb_build_object('ok', false, 'error_code', 'seat_holds_nothing');
  end if;

  update public.sermon_evaluations
  set released_to_mentee_at = v_now
  where id = p_evaluation_id
    and status = 'complete'
    and released_to_mentee_at is null;
  get diagnostics v_rows = row_count;

  if v_rows <> 1 then
    return jsonb_build_object('ok', false, 'error_code', 'already_released_or_incomplete');
  end if;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'evaluation_id', p_evaluation_id,
    'released_to_mentee_at', v_now
  );
end;
$function$;

grant execute on function public.list_mentored_evaluations_for_mentor() to authenticated, postgres, service_role;
grant execute on function public.release_mentored_evaluation(uuid) to authenticated, postgres, service_role;
