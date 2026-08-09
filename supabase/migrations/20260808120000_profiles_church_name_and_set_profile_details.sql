-- profiles.church_name for account page prefill, plus SECURITY DEFINER write path.
-- profiles has no UPDATE policy for authenticated clients; clients must use RPCs.
-- set_display_name is intentionally unchanged (mentoring rejects blank names).

alter table public.profiles
  add column if not exists church_name text;

comment on column public.profiles.church_name is
  'Home or primary church name for the preacher. Optional. Used to prefill evaluation context; guest-pulpit edits on a single sermon do not write back here.';

create or replace function public.set_profile_details(
  p_display_name text,
  p_church_name text
)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_display_name text := nullif(btrim(coalesce(p_display_name, '')), '');
  v_church_name text := nullif(btrim(coalesce(p_church_name, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if v_display_name is not null and char_length(v_display_name) > 80 then
    raise exception 'display_name must be at most 80 characters';
  end if;

  if v_church_name is not null and char_length(v_church_name) > 120 then
    raise exception 'church_name must be at most 120 characters';
  end if;

  update public.profiles
  set
    display_name = v_display_name,
    church_name = v_church_name
  where id = auth.uid();
end;
$function$;

revoke all on function public.set_profile_details(text, text) from public, anon;
grant execute on function public.set_profile_details(text, text) to authenticated;

comment on function public.set_profile_details(text, text) is
  'Account page writer for display_name and church_name. profiles has no UPDATE policy so this must be SECURITY DEFINER. Always writes both columns for the caller (auth.uid()). Empty/blank after trim stores NULL. display_name cap 80 matches set_display_name; church_name cap 120. Does not replace set_display_name, which mentoring still uses and which rejects blank.';
