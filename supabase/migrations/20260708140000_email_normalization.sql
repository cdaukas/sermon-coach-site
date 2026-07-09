-- Email normalization + signup abuse defense.
-- Captures the objects applied by hand in the Supabase SQL Editor so the repo
-- matches production. Founder's own +demo/+test accounts (canonical
-- cdaukas@gmail.com) are allowlisted so throwaway test signups keep working.

-- 1. Canonical form: gmail ignores dots and +tags; strip +tags for all providers.
create or replace function public.normalize_email(email text)
returns text
language sql
immutable
as $$
  select case
    when lower(split_part(email, '@', 2)) in ('gmail.com', 'googlemail.com')
      then replace(split_part(lower(split_part(email, '@', 1)), '+', 1), '.', '') || '@gmail.com'
    else lower(split_part(split_part(email, '@', 1), '+', 1)) || '@' || lower(split_part(email, '@', 2))
  end;
$$;

-- 2. Store canonical form on profiles.
alter table public.profiles
  add column if not exists normalized_email text;

-- 3. Trigger keeps normalized_email populated for ALL profile inserts/updates.
create or replace function public.set_profile_normalized_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.normalized_email is null then
    select public.normalize_email(u.email) into new.normalized_email
    from auth.users u where u.id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_profile_normalized_email on public.profiles;
create trigger trg_set_profile_normalized_email
before insert or update on public.profiles
for each row execute function public.set_profile_normalized_email();

-- 4. Backfill existing rows (no-op on a fresh database).
update public.profiles p
set normalized_email = public.normalize_email(u.email)
from auth.users u
where u.id = p.id and p.normalized_email is null;

-- 5. One account per canonical inbox — EXCEPT the allowlisted founder address.
create unique index if not exists profiles_normalized_email_key
  on public.profiles (normalized_email)
  where normalized_email <> 'cdaukas@gmail.com';

-- 6. Pre-signup availability check the app calls.
create or replace function public.email_available(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when public.normalize_email(p_email) = 'cdaukas@gmail.com' then true
    else not exists (
      select 1 from public.profiles
      where normalized_email = public.normalize_email(p_email)
    )
  end;
$$;

grant execute on function public.email_available(text) to anon, authenticated;
