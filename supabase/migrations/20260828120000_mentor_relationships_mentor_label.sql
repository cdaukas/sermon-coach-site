-- Mentor's label for the preacher on this seat. Optional. Existing rows stay
-- null and must keep rendering as email-only.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260828120000

alter table public.mentor_relationships
  add column if not exists mentor_label text;

comment on column public.mentor_relationships.mentor_label is
  'Mentor''s label for the preacher on this seat. Optional. Entered before the mentee has an account; never written to profiles.display_name. Name-first checkout will pass this same value through Stripe session metadata into this column — do not assume it always arrives from a form.';

-- Drop the one-arg overload. CREATE OR REPLACE with a new argument would
-- leave both signatures live, and PostgREST then refuses the call as
-- ambiguous. The default on p_mentor_label keeps { p_seat_type } working.
drop function if exists public.create_mentor_invite(text);

create or replace function public.create_mentor_invite(
  p_seat_type text,
  p_mentor_label text default null
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
    mentor_label
  ) values (
    v_uid,
    v_token,
    'pending',
    v_seat_type,
    v_mentor_label
  );

  return v_token;
end;
$function$;

comment on function public.create_mentor_invite(text, text) is
  'Creates a pending mentoring invite and returns the token. Requires seat_type (debrief|evaluation). Optional p_mentor_label is the mentor''s name for this preacher (blank stores null). The value may arrive from the invite form or, later, from Stripe checkout session metadata into mentor_relationships.mentor_label — do not assume a form. Entitlement: pending+active of that type <= purchased of that type + comp for that type (comp_debrief_seats for debrief only; evaluation has no comp). Revoked and ended never count. Comp stacks with purchased; neither is a monthly burn. Does not require a Coach subscription.';

revoke all on function public.create_mentor_invite(text, text) from public, anon;
grant execute on function public.create_mentor_invite(text, text) to authenticated;
