-- First-touch ad parameters, copied from signUp user metadata.
-- Nullable, no defaults, no backfill. Chris applies this by hand.

alter table public.profiles
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists landing_path text;

comment on column public.profiles.utm_source is
  'First-touch utm_source from signup metadata. Null when the visit had no sc_utm cookie.';
comment on column public.profiles.utm_medium is
  'First-touch utm_medium from signup metadata.';
comment on column public.profiles.utm_campaign is
  'First-touch utm_campaign from signup metadata.';
comment on column public.profiles.utm_content is
  'First-touch utm_content from signup metadata.';
comment on column public.profiles.landing_path is
  'Pathname of the first page that carried utm_ parameters. No query string.';

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

  insert into public.profiles (
    id,
    newsletter_opted_in,
    tuesday_nudge_opted_in,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    landing_path
  )
  values (
    new.id,
    v_newsletter,
    v_tuesday_nudge,
    left(nullif(btrim(new.raw_user_meta_data ->> 'utm_source'), ''), 200),
    left(nullif(btrim(new.raw_user_meta_data ->> 'utm_medium'), ''), 200),
    left(nullif(btrim(new.raw_user_meta_data ->> 'utm_campaign'), ''), 200),
    left(nullif(btrim(new.raw_user_meta_data ->> 'utm_content'), ''), 200),
    left(nullif(btrim(new.raw_user_meta_data ->> 'landing_path'), ''), 200)
  );
  return new;
end;
$$;
