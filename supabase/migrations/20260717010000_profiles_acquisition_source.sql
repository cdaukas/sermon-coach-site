-- Acquisition attribution collected at post-signup /start interstitial.
-- Client UPDATE on profiles is revoked; writes go through this SECURITY DEFINER RPC.

alter table public.profiles
  add column if not exists acquisition_source text,
  add column if not exists acquisition_source_detail text,
  add column if not exists acquisition_source_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_acquisition_source_check;

alter table public.profiles
  add constraint profiles_acquisition_source_check
  check (
    acquisition_source is null
    or acquisition_source in (
      'pastor_friend',
      'chris_email',
      'newsletter_blog',
      'gtn',
      'search',
      'social',
      'other'
    )
  );

comment on column public.profiles.acquisition_source is
  'Normalized acquisition channel from optional post-signup question. Distinct from referral_source (Bitly).';

comment on column public.profiles.acquisition_source_detail is
  'Free-text detail when acquisition_source is other; otherwise null.';

comment on column public.profiles.acquisition_source_at is
  'When the user answered the acquisition question.';

create or replace function public.set_acquisition_source(
  p_source text,
  p_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text := nullif(btrim(p_source), '');
  v_detail text := nullif(btrim(coalesce(p_detail, '')), '');
begin
  if v_source is null then
    raise exception 'acquisition_source is required';
  end if;

  if v_source not in (
    'pastor_friend',
    'chris_email',
    'newsletter_blog',
    'gtn',
    'search',
    'social',
    'other'
  ) then
    raise exception 'invalid acquisition_source: %', v_source;
  end if;

  if v_source is distinct from 'other' then
    v_detail := null;
  end if;

  update public.profiles
  set
    acquisition_source = v_source,
    acquisition_source_detail = v_detail,
    acquisition_source_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.set_acquisition_source(text, text) from public, anon;
grant execute on function public.set_acquisition_source(text, text) to authenticated;
