-- Mentee-visible calendar-month submission count for one relationship.
-- Bypasses sermon_evaluations_select_own so Apprentice / dark Apprentice
-- can read the same diagnostic count the allotment gate uses.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260904220000
-- Then verify with pg_get_functiondef (a schema_migrations row is not proof).

create or replace function public.mentored_submissions_this_month(
  p_relationship_id uuid
)
returns integer
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_used int;
begin
  if v_uid is null or p_relationship_id is null then
    return null;
  end if;

  -- Caller must be the mentee or the mentor on this row. Anyone else gets
  -- null, not a number.
  if not exists (
    select 1
    from public.mentor_relationships mr
    where mr.id = p_relationship_id
      and (mr.mentee_id = v_uid or mr.mentor_id = v_uid)
  ) then
    return null;
  end if;

  -- Predicate matched literally from create_mentored_evaluation:
  --   where mentor_relationship_id = v_relationship_id
  --     and report_mode = 'diagnostic'
  --     and created_at >= date_trunc('month', now());
  select count(*)::int into v_used
  from public.sermon_evaluations
  where mentor_relationship_id = p_relationship_id
    and report_mode = 'diagnostic'
    and created_at >= date_trunc('month', now());

  return v_used;
end;
$function$;

revoke all on function public.mentored_submissions_this_month(uuid)
  from public;
grant execute on function public.mentored_submissions_this_month(uuid)
  to authenticated;

comment on function public.mentored_submissions_this_month(uuid) is
  'Calendar-month diagnostic submission count for one mentor_relationships row. Same predicate as create_mentored_evaluation allotment (report_mode diagnostic, created_at >= date_trunc month now). SECURITY DEFINER so mentees can read the count when RLS hides held diagnostics. Returns null unless auth.uid() is the mentee_id or mentor_id on that row. No writes.';
