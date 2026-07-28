-- Mentor relationship SELECT for parties, plus anon-safe invite preview.
-- Grant must precede policies or the policies stay inert (no table grant).

grant select on public.mentor_relationships to authenticated;

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
    coalesce(
      nullif(btrim(coalesce(p.display_name, '')), ''),
      'a preacher you know'
    ),
    mr.seat_type
  into v_mentor_name, v_seat_type
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

  return jsonb_build_object(
    'ok', true,
    'error_code', null,
    'mentor_name', v_mentor_name,
    'seat_type', v_seat_type
  );
end;
$function$;

revoke all on function public.preview_mentor_invite(text) from public;
grant execute on function public.preview_mentor_invite(text) to anon, authenticated;

comment on function public.preview_mentor_invite(text) is
  'Returns the minimum an invitee needs to decide whether to accept. Deliberately callable by anon because a preacher clicking an invite link has no account yet. The only unauthenticated surface in the mentoring build so the projection is tight: no ids, no email, no counters. Falls back to a generic phrase rather than leaking the mentor email. Returns invalid_or_used for both unknown and non-pending tokens so it cannot be used to enumerate.';

create policy mentor_relationships_select_as_mentor
  on public.mentor_relationships
  for select
  to authenticated
  using (mentor_id = auth.uid());

create policy mentor_relationships_select_as_mentee
  on public.mentor_relationships
  for select
  to authenticated
  using (mentee_id = auth.uid());
