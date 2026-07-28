-- SECURITY DEFINER write path for profiles.display_name.
-- profiles has no UPDATE policy; clients cannot write the column directly.

create or replace function public.set_display_name(
  p_display_name text
)
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_name text := nullif(btrim(coalesce(p_display_name, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if v_name is null then
    raise exception 'display_name must not be blank';
  end if;

  if char_length(v_name) > 80 then
    raise exception 'display_name must be at most 80 characters';
  end if;

  update public.profiles
  set display_name = v_name
  where id = auth.uid();

  return v_name;
end;
$function$;

revoke all on function public.set_display_name(text) from public;
grant execute on function public.set_display_name(text) to authenticated;

comment on function public.set_display_name(text) is
  'profiles has no UPDATE policy so this must be SECURITY DEFINER. Trims and rejects blank. 80 char cap because it renders inline in invite copy. Overwrites freely so a mentor may correct his own name. Uses the caller''s auth.uid() only.';
