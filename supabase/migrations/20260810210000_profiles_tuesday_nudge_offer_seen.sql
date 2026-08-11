-- One-time stamp for the post-evaluation Tuesday nudge offer.
-- Null means never shown; once set, the offer does not render again.

alter table public.profiles
  add column if not exists tuesday_nudge_offer_seen_at timestamptz;

comment on column public.profiles.tuesday_nudge_offer_seen_at is
  'When the pastor confirmed or dismissed the post-evaluation Tuesday nudge offer. Null means never shown. Once set, the offer is not shown again on any evaluation.';

create or replace function public.set_tuesday_nudge_offer_seen()
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
  set tuesday_nudge_offer_seen_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.set_tuesday_nudge_offer_seen() from public, anon;
grant execute on function public.set_tuesday_nudge_offer_seen() to authenticated;

comment on function public.set_tuesday_nudge_offer_seen() is
  'Stamps profiles.tuesday_nudge_offer_seen_at = now() for auth.uid(). profiles has no UPDATE policy so this must be SECURITY DEFINER. Preference writes stay on set_email_preferences.';
