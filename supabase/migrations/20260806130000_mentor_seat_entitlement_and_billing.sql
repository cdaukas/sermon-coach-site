-- Mentoring seat entitlement + drop dead counters.
-- Capacity: pending + active of a type <= purchased of that type + comp for that type.
-- Comp is Apprentice (debrief) only. Colleague has no complimentary column.
-- Revoked/ended rows never consume capacity.

-- ---------------------------------------------------------------------------
-- 1. Purchased seat columns (Stripe inventory; written by service role / webhook)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists purchased_debrief_seats integer not null default 0;

alter table public.profiles
  add column if not exists purchased_evaluation_seats integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_purchased_debrief_seats_check;

alter table public.profiles
  add constraint profiles_purchased_debrief_seats_check
  check (purchased_debrief_seats >= 0);

alter table public.profiles
  drop constraint if exists profiles_purchased_evaluation_seats_check;

alter table public.profiles
  add constraint profiles_purchased_evaluation_seats_check
  check (purchased_evaluation_seats >= 0);

comment on column public.profiles.purchased_debrief_seats is
  'Apprentice (seat_type=debrief) seats provisioned from an active Stripe seat subscription quantity. Service role / webhook writes only. Comp is separate (comp_debrief_seats).';

comment on column public.profiles.purchased_evaluation_seats is
  'Colleague (seat_type=evaluation) seats provisioned from an active Stripe seat subscription quantity. Service role / webhook writes only. No comp column for this type.';

-- ---------------------------------------------------------------------------
-- 2. Drop dead counters (never read after insert)
-- ---------------------------------------------------------------------------

alter table public.mentor_relationships
  drop column if exists debriefs_used_this_period;

alter table public.mentor_relationships
  drop column if exists evals_triggered_this_period;

-- ---------------------------------------------------------------------------
-- 3. Shared monthly cap helper (same numbers create_mentored_evaluation enforces)
-- ---------------------------------------------------------------------------

create or replace function public.mentored_monthly_submission_limit(p_seat_type text)
returns integer
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select case p_seat_type
    when 'debrief' then 2
    when 'evaluation' then 4
    else null
  end;
$$;

revoke all on function public.mentored_monthly_submission_limit(text) from public, anon;
grant execute on function public.mentored_monthly_submission_limit(text) to authenticated, postgres, service_role;

comment on function public.mentored_monthly_submission_limit(text) is
  'Monthly diagnostic-row cap per relationship: 2 for debrief (Apprentice), 4 for evaluation (Colleague). Single source for enforce + display.';

-- ---------------------------------------------------------------------------
-- 4. create_mentor_invite: per-type purchased + comp (comp only on debrief)
-- ---------------------------------------------------------------------------

create or replace function public.create_mentor_invite(
  p_seat_type text
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_token text;
  v_seat_type text := nullif(btrim(coalesce(p_seat_type, '')), '');
  v_uid uuid := auth.uid();
  v_used int;
  v_purchased int;
  v_comp int;
  v_capacity int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if v_seat_type is null or v_seat_type not in ('debrief', 'evaluation') then
    raise exception 'seat_type must be debrief or evaluation';
  end if;

  select
    case v_seat_type
      when 'debrief' then coalesce(p.purchased_debrief_seats, 0)
      when 'evaluation' then coalesce(p.purchased_evaluation_seats, 0)
    end,
    case v_seat_type
      when 'debrief' then coalesce(p.comp_debrief_seats, 0)
      else 0
    end
  into v_purchased, v_comp
  from public.profiles p
  where p.id = v_uid;

  if not found then
    raise exception 'profile not found';
  end if;

  -- Comp is permanent capacity stack; total is comp + purchased (comp not drawn down separately).
  v_capacity := v_comp + v_purchased;

  select count(*)::int
  into v_used
  from public.mentor_relationships
  where mentor_id = v_uid
    and seat_type = v_seat_type
    and status in ('pending', 'active');

  if v_used >= v_capacity then
    raise exception 'seat limit reached: no available seats of this type';
  end if;

  v_token := gen_random_uuid()::text;

  insert into public.mentor_relationships (
    mentor_id,
    invite_token,
    status,
    seat_type
  ) values (
    v_uid,
    v_token,
    'pending',
    v_seat_type
  );

  return v_token;
end;
$function$;

comment on function public.create_mentor_invite(text) is
  'Creates a pending mentoring invite and returns the token. Requires seat_type (debrief|evaluation). Entitlement: pending+active of that type <= purchased of that type + comp for that type (comp_debrief_seats for debrief only; evaluation has no comp). Revoked and ended never count. Comp stacks with purchased; neither is a monthly burn. Does not require a Coach subscription.';

-- ---------------------------------------------------------------------------
-- 5. Mentor-facing capacity + usage (same math as enforce)
-- ---------------------------------------------------------------------------

create or replace function public.get_mentor_seat_capacity()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_purchased_debrief int;
  v_purchased_evaluation int;
  v_comp_debrief int;
  v_used_debrief int;
  v_used_evaluation int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_authenticated');
  end if;

  select
    coalesce(p.purchased_debrief_seats, 0),
    coalesce(p.purchased_evaluation_seats, 0),
    coalesce(p.comp_debrief_seats, 0)
  into
    v_purchased_debrief,
    v_purchased_evaluation,
    v_comp_debrief
  from public.profiles p
  where p.id = v_uid;

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'profile_not_found');
  end if;

  select count(*)::int into v_used_debrief
  from public.mentor_relationships
  where mentor_id = v_uid
    and seat_type = 'debrief'
    and status in ('pending', 'active');

  select count(*)::int into v_used_evaluation
  from public.mentor_relationships
  where mentor_id = v_uid
    and seat_type = 'evaluation'
    and status in ('pending', 'active');

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'debrief', jsonb_build_object(
      'used', v_used_debrief,
      'capacity', v_comp_debrief + v_purchased_debrief,
      'purchased', v_purchased_debrief,
      'comp', v_comp_debrief
    ),
    'evaluation', jsonb_build_object(
      'used', v_used_evaluation,
      'capacity', v_purchased_evaluation,
      'purchased', v_purchased_evaluation,
      'comp', 0
    )
  );
end;
$function$;

revoke all on function public.get_mentor_seat_capacity() from public, anon;
grant execute on function public.get_mentor_seat_capacity() to authenticated, postgres, service_role;

comment on function public.get_mentor_seat_capacity() is
  'Seat used vs capacity for the signed-in mentor. Same pending+active and purchased+comp formula as create_mentor_invite. Display source only; enforcement remains in create_mentor_invite.';

-- Re-apply create_mentored_evaluation with shared limit helper (and same two-row insert).
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
