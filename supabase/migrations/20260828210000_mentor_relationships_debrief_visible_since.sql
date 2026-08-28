-- When a dark Apprentice relationship is opened to the debrief, stamp the
-- moment so earlier evaluations stay hidden. NULL means never flipped (or
-- never dark). Apply by hand in the Supabase SQL editor. Do not supabase db
-- push. After apply: supabase migration repair --status applied 20260828210000

alter table public.mentor_relationships
  add column if not exists debrief_visible_since timestamptz;

comment on column public.mentor_relationships.debrief_visible_since is
  'When the mentee started seeing the coaching debrief on new submissions. Null on never-dark and still-dark rows. Set when mentee_reads flips from none to null. Evaluations with created_at before this stamp stay hidden.';

-- Two-arg helper first so the policy can switch, then drop the one-arg
-- overload. Leaving both would be unused, not PostgREST-ambiguous (this is
-- not an RPC the client calls), but the policy must have exactly one target.
create or replace function public.relationship_mentee_reads_none(
  p_relationship_id uuid,
  p_created_at timestamptz
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
      and (
        mr.mentee_reads = 'none'
        or (
          mr.debrief_visible_since is not null
          and p_created_at < mr.debrief_visible_since
        )
      )
  );
$$;

revoke all on function public.relationship_mentee_reads_none(uuid, timestamptz)
  from public, anon;
grant execute on function public.relationship_mentee_reads_none(uuid, timestamptz)
  to authenticated;

comment on function public.relationship_mentee_reads_none(uuid, timestamptz) is
  'Reads mentor_relationships, which is deny-all under RLS, so this must be SECURITY DEFINER with a locked search_path. True when the relationship is still dark (mentee_reads = none), or when it was opened later and this evaluation was created before debrief_visible_since. Never-dark rows have both null and return false.';

alter policy sermon_evaluations_select_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and (
      mentor_relationship_id is null
      or (
        not public.relationship_mentee_reads_none(
          mentor_relationship_id,
          created_at
        )
        and (
          report_mode = 'debrief'
          or released_to_mentee_at is not null
          or not public.relationship_holds_evaluations(mentor_relationship_id)
        )
      )
    )
  );

drop function if exists public.relationship_mentee_reads_none(uuid);

-- True when this sermon has a mentored evaluation the mentee still cannot
-- read (fully dark, or created before the stamp). Used so an old sermon
-- keeps the handoff after a flip instead of rendering empty.
create or replace function public.mentee_sermon_is_dark_handoff(
  p_sermon_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.sermon_evaluations se
    join public.sermon_versions sv on sv.id = se.sermon_version_id
    join public.sermons s on s.id = sv.sermon_id
    where s.id = p_sermon_id
      and s.user_id = auth.uid()
      and se.mentor_relationship_id is not null
      and public.relationship_mentee_reads_none(
        se.mentor_relationship_id,
        se.created_at
      )
  );
$$;

revoke all on function public.mentee_sermon_is_dark_handoff(uuid)
  from public, anon;
grant execute on function public.mentee_sermon_is_dark_handoff(uuid)
  to authenticated;

comment on function public.mentee_sermon_is_dark_handoff(uuid) is
  'SECURITY DEFINER so it can see mentored rows the mentee SELECT policy hides. True when the caller owns the sermon and at least one mentored evaluation on it is still dark under relationship_mentee_reads_none.';

create or replace function public.enable_mentee_debrief(
  p_relationship_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.mentor_relationships%rowtype;
  v_now timestamptz := now();
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

  if v_row.mentor_id is distinct from v_uid then
    return jsonb_build_object('ok', false, 'error_code', 'not_the_mentor');
  end if;

  if v_row.status is distinct from 'active' then
    return jsonb_build_object('ok', false, 'error_code', 'not_active');
  end if;

  if v_row.mentee_reads is distinct from 'none' then
    return jsonb_build_object('ok', false, 'error_code', 'not_dark');
  end if;

  update public.mentor_relationships
  set
    mentee_reads = null,
    debrief_visible_since = v_now
  where id = v_row.id
    and status = 'active'
    and mentee_reads = 'none';

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'not_dark');
  end if;

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'relationship_id', v_row.id,
    'debrief_visible_since', v_now
  );
end;
$function$;

comment on function public.enable_mentee_debrief(uuid) is
  'Mentor-only, forward-only: none to debrief. Sets mentee_reads to null and stamps debrief_visible_since. Evaluations created before the stamp stay hidden. Does not email the mentee.';

revoke all on function public.enable_mentee_debrief(uuid) from public, anon;
grant execute on function public.enable_mentee_debrief(uuid)
  to authenticated, postgres, service_role;
