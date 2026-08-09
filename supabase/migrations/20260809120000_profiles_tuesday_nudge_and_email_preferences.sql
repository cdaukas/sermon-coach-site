-- Tuesday nudge preference (opt-in only; default false for all existing rows).
-- New account writes go through handle_new_user metadata + optional set_email_preferences.
-- set_newsletter_opted_in stays for existing call sites.

alter table public.profiles
  add column if not exists tuesday_nudge_opted_in boolean not null default false;

comment on column public.profiles.tuesday_nudge_opted_in is
  'Opt-in for the Tuesday planning nudge email. False by default; never grandfathered. Preference only until a sender exists.';

create or replace function public.set_email_preferences(
  p_newsletter boolean,
  p_tuesday_nudge boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set
    newsletter_opted_in = coalesce(p_newsletter, false),
    tuesday_nudge_opted_in = coalesce(p_tuesday_nudge, false)
  where id = auth.uid();
end;
$$;

revoke all on function public.set_email_preferences(boolean, boolean) from public, anon;
grant execute on function public.set_email_preferences(boolean, boolean) to authenticated;

comment on function public.set_email_preferences(boolean, boolean) is
  'Account Emails section writer for newsletter_opted_in and tuesday_nudge_opted_in. profiles has no UPDATE policy so this must be SECURITY DEFINER. Always writes both columns for auth.uid(). Coalesces null to false. set_newsletter_opted_in remains for legacy single-column callers.';

-- Signup without an immediate session: stamp both prefs from user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_newsletter boolean := false;
  v_tuesday_nudge boolean := false;
  v_raw text;
begin
  v_raw := new.raw_user_meta_data ->> 'newsletter_opted_in';
  if v_raw is not null and lower(btrim(v_raw)) in ('true', 't', '1') then
    v_newsletter := true;
  end if;

  v_raw := new.raw_user_meta_data ->> 'tuesday_nudge_opted_in';
  if v_raw is not null and lower(btrim(v_raw)) in ('true', 't', '1') then
    v_tuesday_nudge := true;
  end if;

  insert into public.profiles (id, newsletter_opted_in, tuesday_nudge_opted_in)
  values (new.id, v_newsletter, v_tuesday_nudge);
  return new;
end;
$$;
