-- Stamp acquisition_source_at when the user leaves the attribution prompt
-- without selecting a source (skip). Leaves acquisition_source null.

create or replace function public.acknowledge_acquisition_prompt()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set acquisition_source_at = coalesce(acquisition_source_at, now())
  where id = auth.uid();
$$;

revoke all on function public.acknowledge_acquisition_prompt() from public, anon;
grant execute on function public.acknowledge_acquisition_prompt() to authenticated;
