-- What the mentee reads on this seat. NULL means debrief (current behaviour).
-- 'none' is the dark Apprentice option: he reads nothing; the mentor delivers.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260828190000

alter table public.mentor_relationships
  add column if not exists mentee_reads text;

alter table public.mentor_relationships
  drop constraint if exists mentor_relationships_mentee_reads_check;

alter table public.mentor_relationships
  add constraint mentor_relationships_mentee_reads_check
  check (
    mentee_reads is null
    or mentee_reads in ('debrief', 'none')
  );

comment on column public.mentor_relationships.mentee_reads is
  'What the mentee reads. NULL and debrief mean the coaching debrief (current behaviour). none means he reads nothing; the mentor delivers in person. Apprentice only; Colleague always stores null. Existing rows stay null and keep reading the debrief.';

-- Drop the two-arg overload. CREATE OR REPLACE with a new argument would
-- leave both signatures live, and PostgREST then refuses the call as
-- ambiguous. Defaults on p_mentor_label and p_mentee_reads keep
-- { p_seat_type } and { p_seat_type, p_mentor_label } working.
drop function if exists public.create_mentor_invite(text, text);

create or replace function public.create_mentor_invite(
  p_seat_type text,
  p_mentor_label text default null,
  p_mentee_reads text default null
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_token text;
  v_seat_type text := nullif(btrim(coalesce(p_seat_type, '')), '');
  v_mentor_label text := nullif(btrim(coalesce(p_mentor_label, '')), '');
  v_mentee_reads text := nullif(btrim(coalesce(p_mentee_reads, '')), '');
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

  if v_mentor_label is not null and char_length(v_mentor_label) > 80 then
    raise exception 'mentor_label must be at most 80 characters';
  end if;

  if v_mentee_reads is not null and v_mentee_reads not in ('debrief', 'none') then
    raise exception 'mentee_reads must be debrief or none';
  end if;

  -- Colleague sees everything by definition. Dark is Apprentice only.
  if v_seat_type = 'evaluation' then
    v_mentee_reads := null;
  elsif v_mentee_reads = 'debrief' then
    -- Named debrief is the default; store null so existing rows and new
    -- defaults stay the same value.
    v_mentee_reads := null;
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
    seat_type,
    mentor_label,
    mentee_reads
  ) values (
    v_uid,
    v_token,
    'pending',
    v_seat_type,
    v_mentor_label,
    v_mentee_reads
  );

  return v_token;
end;
$function$;

comment on function public.create_mentor_invite(text, text, text) is
  'Creates a pending mentoring invite and returns the token. Requires seat_type (debrief|evaluation). Optional p_mentor_label is the mentor''s name for this preacher (blank stores null). Optional p_mentee_reads is debrief (stored null) or none (dark Apprentice). Colleague always stores null. Entitlement: pending+active of that type <= purchased of that type + comp for that type (comp_debrief_seats for debrief only; evaluation has no comp). Revoked and ended never count. Comp stacks with purchased; neither is a monthly burn. Does not require a Coach subscription.';

revoke all on function public.create_mentor_invite(text, text, text) from public, anon;
grant execute on function public.create_mentor_invite(text, text, text) to authenticated;

create or replace function public.relationship_mentee_reads_none(
  p_relationship_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.mentor_relationships mr
    where mr.id = p_relationship_id
      and mr.mentee_reads = 'none'
  );
$$;

revoke all on function public.relationship_mentee_reads_none(uuid)
  from public;
grant execute on function public.relationship_mentee_reads_none(uuid)
  to authenticated;

comment on function public.relationship_mentee_reads_none(uuid) is
  'Reads mentor_relationships, which is deny-all under RLS, so this must be SECURITY DEFINER with a locked search_path. True only when mentee_reads is none (dark). NULL and debrief return false, so existing relationships keep current debrief visibility.';

-- Gate the debrief short-circuit and the release clause. Dark blocks both
-- the debrief and the diagnostic. Unmentored rows stay readable. Mentor
-- SELECT is a different policy and is unchanged.
alter policy sermon_evaluations_select_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and (
      mentor_relationship_id is null
      or (
        not public.relationship_mentee_reads_none(mentor_relationship_id)
        and (
          report_mode = 'debrief'
          or released_to_mentee_at is not null
          or not public.relationship_holds_evaluations(mentor_relationship_id)
        )
      )
    )
  );

-- Invitee needs to know whether this invite is dark before accepting.
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
  v_mentee_reads text;
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
    mr.seat_type,
    mr.mentee_reads
  into v_mentor_id, v_mentor_name, v_seat_type, v_mentee_reads
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
    'seat_type', v_seat_type,
    'mentee_reads', v_mentee_reads
  );
end;
$function$;

revoke all on function public.preview_mentor_invite(text) from public;
grant execute on function public.preview_mentor_invite(text) to anon, authenticated;

comment on function public.preview_mentor_invite(text) is
  'Anon-safe invite preview. Returns invalid_or_used for unknown, non-pending, or over-capacity tokens so stale cancel leftovers cannot promise submissions from a missing seat. mentee_reads is null or debrief for current behaviour, none for a dark Apprentice invite.';
