alter table public.profiles
  add column if not exists last_active_at timestamptz;

comment on column public.profiles.last_active_at is
  'Updated when the user opens the app with an active session; distinct from auth.users.last_sign_in_at.';

create or replace function public.touch_last_active()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_active_at = now()
  where id = auth.uid();
$$;

revoke all on function public.touch_last_active() from public, anon;
grant execute on function public.touch_last_active() to authenticated;
