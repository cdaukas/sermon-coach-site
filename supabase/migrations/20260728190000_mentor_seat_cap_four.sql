-- Raise create_mentor_invite seat cap from 3 to 4 so Classroom (5+)
-- has no gap with the individual-seat path (1-4).

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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if v_seat_type is null or v_seat_type not in ('debrief', 'evaluation') then
    raise exception 'seat_type must be debrief or evaluation';
  end if;

  if (
    select count(*)
    from public.mentor_relationships
    where mentor_id = auth.uid()
      and status in ('pending', 'active')
  ) >= 4 then
    raise exception 'seat limit reached: a mentor may hold at most 4 seats';
  end if;

  v_token := gen_random_uuid()::text;

  insert into public.mentor_relationships (
    mentor_id,
    invite_token,
    status,
    seat_type
  ) values (
    auth.uid(),
    v_token,
    'pending',
    v_seat_type
  );

  return v_token;
end;
$function$;

comment on function public.create_mentor_invite(text) is
  'Creates a pending mentoring invite and returns the token. Requires seat_type explicitly because it determines whether the mentee ever sees his own evaluation scores. Caps a mentor at 4 seats across pending and active: 1-4 is the seat path, Classroom starts at a minimum of 5 seats, with no gap between them. Does not verify the mentor holds a paid seat in Stripe, which is a separate gap.';
