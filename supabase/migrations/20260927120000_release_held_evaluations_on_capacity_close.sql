-- Release held Apprentice diagnostics whenever a mentoring relationship ends.
-- Manual end and the capacity close (seat cancel, deletion, or a quantity
-- drop) both call release_held_evaluations_for_relationship. One statement,
-- so the row filter cannot drift.
--
-- Additive. Not applied by this change. Apply by hand in the Supabase SQL
-- editor, then: supabase migration repair --status applied 20260927120000
--
-- Rollback (run only to reverse; do not run with the forward migration):
--   1. Restore public.end_mentor_relationship from
--      20260803160000_end_and_revoke_mentor_relationship.sql (the inline
--      UPDATE of sermon_evaluations).
--   2. drop function public.end_active_mentor_relationships_at_capacity(uuid[]);
--   3. drop function public.release_held_evaluations_for_relationship(uuid);

create or replace function public.release_held_evaluations_for_relationship(
  p_relationship_id uuid
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_released int;
begin
  if p_relationship_id is null then
    return 0;
  end if;

  -- Same rows end_mentor_relationship released before this was factored out:
  -- complete diagnostics still held. Incomplete rows, debrief rows, other
  -- relationships, and anything already released are untouched. Colleague
  -- diagnostics are not gated on this column; stamping a null here does not
  -- change what the preacher can see.
  update public.sermon_evaluations
  set released_to_mentee_at = now()
  where mentor_relationship_id = p_relationship_id
    and report_mode = 'diagnostic'
    and status = 'complete'
    and released_to_mentee_at is null;

  get diagnostics v_released = row_count;
  return v_released;
end;
$function$;

revoke all on function public.release_held_evaluations_for_relationship(uuid)
  from public, anon, authenticated;
grant execute on function public.release_held_evaluations_for_relationship(uuid)
  to postgres, service_role;

comment on function public.release_held_evaluations_for_relationship(uuid) is
  'Sets released_to_mentee_at on every still-held complete diagnostic for one relationship. Called from end_mentor_relationship and from end_active_mentor_relationships_at_capacity. Not granted to authenticated: a direct call would release scores without ending the relationship. SECURITY DEFINER so those callers can write the column. Write-once trigger still applies.';

-- Manual end. Authorization and the status write are unchanged. The release
-- is the shared function, in this same transaction, after the row is ended.
create or replace function public.end_mentor_relationship(p_relationship_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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

  v_released := public.release_held_evaluations_for_relationship(v_row.id);

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'relationship_id', v_row.id,
    'ended_at', v_now,
    'released_count', v_released
  );
end;
$function$;

-- Capacity close. One transaction for the batch: status ended, then the
-- shared release, and only for rows this statement actually moved from
-- active. An already-ended relationship is left alone, so a retry does not
-- backfill seats that closed before this function existed.
create or replace function public.end_active_mentor_relationships_at_capacity(
  p_relationship_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_id uuid;
  v_now timestamptz := now();
  v_ended int := 0;
begin
  if p_relationship_ids is null then
    return 0;
  end if;

  foreach v_id in array p_relationship_ids
  loop
    update public.mentor_relationships
    set
      status = 'ended',
      ended_at = v_now
    where id = v_id
      and status = 'active';

    if found then
      v_ended := v_ended + 1;
      perform public.release_held_evaluations_for_relationship(v_id);
    end if;
  end loop;

  return v_ended;
end;
$function$;

revoke all on function public.end_active_mentor_relationships_at_capacity(uuid[])
  from public, anon, authenticated;
grant execute on function public.end_active_mentor_relationships_at_capacity(uuid[])
  to postgres, service_role;

comment on function public.end_active_mentor_relationships_at_capacity(uuid[]) is
  'Ends the given active mentoring relationships and releases their held complete diagnostics through release_held_evaluations_for_relationship. Service role only: the Stripe capacity path. Pending invites are not passed here. Does not release a relationship that is already ended.';
