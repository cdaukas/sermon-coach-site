-- Capacity gates for cancel: accept, preview, and mentored submission.
-- Pending invites that outlive purchased seats must not accept or generate spend.
-- Active relationships on over-capacity mentors still refuse new submissions until
-- a product decision ends or suspends them. Comp_debrief_seats is read-only here.
-- Does not read period_days / period_started_at.

-- ---------------------------------------------------------------------------
-- Shared capacity helpers (same formula as create_mentor_invite)
-- ---------------------------------------------------------------------------

create or replace function public.mentor_seat_capacity_for(
  p_mentor_id uuid,
  p_seat_type text
)
returns integer
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_purchased int;
  v_comp int;
begin
  if p_mentor_id is null
     or p_seat_type is null
     or p_seat_type not in ('debrief', 'evaluation') then
    return 0;
  end if;

  select
    case p_seat_type
      when 'debrief' then coalesce(p.purchased_debrief_seats, 0)
      when 'evaluation' then coalesce(p.purchased_evaluation_seats, 0)
    end,
    case p_seat_type
      when 'debrief' then coalesce(p.comp_debrief_seats, 0)
      else 0
    end
  into v_purchased, v_comp
  from public.profiles p
  where p.id = p_mentor_id;

  if not found then
    return 0;
  end if;

  return greatest(0, v_purchased + v_comp);
end;
$function$;

revoke all on function public.mentor_seat_capacity_for(uuid, text) from public, anon;
grant execute on function public.mentor_seat_capacity_for(uuid, text)
  to authenticated, postgres, service_role;

comment on function public.mentor_seat_capacity_for(uuid, text) is
  'Purchased seats of this type for the mentor, plus comp_debrief_seats for debrief only. Shared by invite, accept, preview, and create_mentored_evaluation. Does not write profiles.';

create or replace function public.mentor_seat_type_used(
  p_mentor_id uuid,
  p_seat_type text
)
returns integer
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select count(*)::int
  from public.mentor_relationships
  where mentor_id = p_mentor_id
    and seat_type = p_seat_type
    and status in ('pending', 'active');
$$;

revoke all on function public.mentor_seat_type_used(uuid, text) from public, anon;
grant execute on function public.mentor_seat_type_used(uuid, text)
  to authenticated, postgres, service_role;

comment on function public.mentor_seat_type_used(uuid, text) is
  'Count of pending+active relationships of one seat type for a mentor. Revoked and ended do not count.';

-- ---------------------------------------------------------------------------
-- preview: dead when pending is over capacity (e.g. post-cancel token)
-- ---------------------------------------------------------------------------

create or replace function public.preview_mentor_invite(
  p_token text
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_token text := nullif(btrim(coalesce(p_token, '')), '');
  v_mentor_id uuid;
  v_mentor_name text;
  v_seat_type text;
begin
  if v_token is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used'
    );
  end if;

  select
    mr.mentor_id,
    coalesce(
      nullif(btrim(coalesce(p.display_name, '')), ''),
      'a preacher you know'
    ),
    mr.seat_type
  into v_mentor_id, v_mentor_name, v_seat_type
  from public.mentor_relationships mr
  left join public.profiles p on p.id = mr.mentor_id
  where mr.invite_token = v_token
    and mr.status = 'pending';

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used'
    );
  end if;

  -- Pending already counts as used; refuse when this invite exceeds capacity.
  if public.mentor_seat_type_used(v_mentor_id, v_seat_type)
       > public.mentor_seat_capacity_for(v_mentor_id, v_seat_type) then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'mentor_name', v_mentor_name,
    'seat_type', v_seat_type
  );
end;
$function$;

comment on function public.preview_mentor_invite(text) is
  'Anon-safe invite preview. Returns invalid_or_used for unknown, non-pending, or over-capacity tokens so stale cancel leftovers cannot promise submissions from a missing seat.';

-- ---------------------------------------------------------------------------
-- accept: refuse when mentor has no free capacity for this seat type
-- ---------------------------------------------------------------------------

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
  'Accepts a pending invite for the signed-in mentee. Refuses no_seat_capacity when the mentor''s pending+active of that seat type exceeds purchased(+comp). Token alone is not trustable after cancel.';

-- ---------------------------------------------------------------------------
-- create_mentored_evaluation: refuse when mentor is over seat capacity
-- ---------------------------------------------------------------------------

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
  v_mentor_id uuid;
  v_seat_type text;
  v_limit int;
  v_used int;
  v_capacity int;
  v_seat_used int;
  v_diagnostic_id uuid;
  v_debrief_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_authenticated');
  end if;
  if nullif(btrim(coalesce(p_prompt_version, '')), '') is null then
    return jsonb_build_object('ok', false, 'error_code', 'missing_prompt_version');
  end if;

  select id, mentor_id, seat_type
  into v_relationship_id, v_mentor_id, v_seat_type
  from public.mentor_relationships
  where mentee_id = v_uid
    and status = 'active';

  if v_relationship_id is null then
    return jsonb_build_object('ok', false, 'error_code', 'no_active_relationship');
  end if;

  v_capacity := public.mentor_seat_capacity_for(v_mentor_id, v_seat_type);
  v_seat_used := public.mentor_seat_type_used(v_mentor_id, v_seat_type);
  if v_capacity < 1 or v_seat_used > v_capacity then
    return jsonb_build_object('ok', false, 'error_code', 'no_seat_capacity');
  end if;

  v_limit := public.mentored_monthly_submission_limit(v_seat_type);
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
  'One mentored submission, one credit, two rows. Refuses no_seat_capacity when the mentor''s pending+active count for the relationship seat type exceeds purchased(+comp). Monthly allotment still from mentored_monthly_submission_limit by seat_type only for the count; capacity is a separate gate. Does not branch generation on seat_type.';

-- Column semantics (Colleague rows may keep released_to_mentee_at null forever).
comment on column public.sermon_evaluations.released_to_mentee_at is
  'When this evaluation became visible to the mentee. Null means held only when the relationship seat_type is debrief (Apprentice); the SELECT path short-circuits on report_mode and relationship_holds_evaluations, so evaluation-seat (Colleague) diagnostics are never gated by this column. Write-once and immutable, enforced by trigger. Set on relationship end (held complete diagnostic rows), mentor early release, or seat upgrade from debrief to evaluation. Do not interpret a null here as held for Colleague pairs.';
