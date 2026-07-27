-- Model B: genuine Friday-post opt-in on profiles.
-- New signups default false. Existing recipients grandfathered true,
-- except emails already in email_suppressions (honor opt-outs).
-- Client UPDATE on profiles is revoked; writes go through RPC or
-- handle_new_user reading signUp user_metadata.

alter table public.profiles
  add column if not exists newsletter_opted_in boolean not null default false;

comment on column public.profiles.newsletter_opted_in is
  'Opt-in for the weekly Friday blog-teaser email. False for new signups unless checked at signup. Grandfathered true for pre-opt-in accounts not in email_suppressions.';

-- Grandfather: preserve current Friday recipients. Join auth.users.email
-- (lowercased), not only normalized_email, so +tag suppressions stay out.
update public.profiles p
set newsletter_opted_in = true
from auth.users u
where u.id = p.id
  and u.email is not null
  and btrim(u.email) <> ''
  and lower(btrim(u.email)) not in (
    select lower(btrim(es.email))
    from public.email_suppressions es
  );

-- Signup path when session is available (or later preference changes).
create or replace function public.set_newsletter_opted_in(p_opted_in boolean)
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
  set newsletter_opted_in = coalesce(p_opted_in, false)
  where id = auth.uid();
end;
$$;

revoke all on function public.set_newsletter_opted_in(boolean) from public, anon;
grant execute on function public.set_newsletter_opted_in(boolean) to authenticated;

-- Email-confirm signups have no session at create time; stamp from user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opted_in boolean := false;
  v_raw text;
begin
  v_raw := new.raw_user_meta_data ->> 'newsletter_opted_in';
  if v_raw is not null and lower(btrim(v_raw)) in ('true', 't', '1') then
    v_opted_in := true;
  end if;

  insert into public.profiles (id, newsletter_opted_in)
  values (new.id, v_opted_in);
  return new;
end;
$$;
