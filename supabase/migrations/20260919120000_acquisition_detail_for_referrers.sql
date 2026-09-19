-- Widen acquisition_source_detail from 'other' only to the sources that imply a
-- person sent the user: 'pastor_friend', 'gtn', 'other'.
--
-- Client UPDATE on profiles is revoked, so this function is what actually
-- enforces which sources may carry a detail. The UI list in
-- src/lib/auth/acquisition-source.ts (ACQUISITION_SOURCES_WITH_DETAIL) mirrors
-- the set below; if they drift, the database wins and the detail is dropped
-- silently.
--
-- No schema change: acquisition_source_detail already exists
-- (20260717010000_profiles_acquisition_source.sql).

comment on column public.profiles.acquisition_source_detail is
  'Free-text detail when acquisition_source is pastor_friend, gtn, or other; otherwise null. Referrer name only, never third-party contact details.';

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

  if v_source not in ('pastor_friend', 'gtn', 'other') then
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
