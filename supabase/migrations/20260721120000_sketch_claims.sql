-- Anonymous Sketch save staging + claim path.
-- Rows live here until claimed into readiness_reads. No user_id. No anon access.

create table if not exists public.sketch_claims (
  id                   uuid primary key default gen_random_uuid(),
  token                text not null unique,
  primary_passage      text,
  ache                 text not null,
  big_idea             text not null,
  gospel_turn          text not null,
  points               text not null,
  one_person           text not null,
  ending               text not null,
  read_output          text not null,
  prompt_version       text not null,
  mode                 text check (mode in ('find', 'press')),
  status_ache          text check (status_ache        in ('solid','thin','seam')),
  status_big_idea      text check (status_big_idea    in ('solid','thin','seam')),
  status_gospel_turn   text check (status_gospel_turn in ('solid','thin','seam')),
  status_points        text check (status_points      in ('solid','thin','seam')),
  status_one_person    text check (status_one_person  in ('solid','thin','seam')),
  status_ending        text check (status_ending      in ('solid','thin','seam')),
  seam_hub             text,
  seam_spokes          text[],
  created_at           timestamptz not null default now(),
  expires_at           timestamptz not null default (now() + interval '30 days'),

  constraint sketch_claims_seam_hub_valid
    check (
      seam_hub is null
      or seam_hub in ('ache','big_idea','gospel_turn','points','one_person','ending')
    ),

  constraint sketch_claims_seam_coherent
    check (
      (mode = 'press' and seam_hub is null and seam_spokes is null)
      or (mode = 'find' and seam_hub is not null
          and seam_spokes is not null and array_length(seam_spokes, 1) >= 1)
      or mode is null
    )
);

create index if not exists sketch_claims_expires_at_idx
  on public.sketch_claims (expires_at);

alter table public.sketch_claims enable row level security;

revoke all on public.sketch_claims from anon, authenticated;

-- Allow 'sketch' as an acquisition channel for the claim path.
-- Table CHECK and RPC allow-list must both accept it or the write fails.
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
      'other',
      'sketch'
    )
  );

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
    'other',
    'sketch'
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
