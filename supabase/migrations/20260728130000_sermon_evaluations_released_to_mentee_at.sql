-- Hold/release for debrief-seat mentored evaluations.
-- Evaluation-seat rows are never held; mentee SELECT widens accordingly.

alter table public.sermon_evaluations
  add column released_to_mentee_at timestamptz null;

comment on column public.sermon_evaluations.released_to_mentee_at is
  'When this evaluation became visible to the mentee. Null means held. Only meaningful on debrief-seat mentored rows since evaluation-seat rows are never held. Write-once and immutable, enforced by trigger. Set on relationship end (all held rows), mentor early release (one row per 90 days), or seat upgrade from debrief to evaluation (all held rows).';

alter table public.sermon_evaluations
  add constraint sermon_evaluations_release_requires_relationship_check
  check (
    released_to_mentee_at is null
    or mentor_relationship_id is not null
  );

create or replace function public.relationship_holds_evaluations(
  p_relationship_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.mentor_relationships mr
    where mr.id = p_relationship_id
      and mr.seat_type = 'debrief'
  );
$$;

revoke all on function public.relationship_holds_evaluations(uuid)
  from public;
grant execute on function public.relationship_holds_evaluations(uuid)
  to authenticated;

comment on function public.relationship_holds_evaluations(uuid) is
  'Reads mentor_relationships, which is deny-all under RLS, so this must be SECURITY DEFINER with a locked search_path. Returns true only when the relationship is a debrief seat that holds the mentee''s evaluations until release.';

create or replace function public.sermon_evaluations_guard_release()
returns trigger
language plpgsql
as $$
begin
  if old.released_to_mentee_at is not null
     and new.released_to_mentee_at is distinct from old.released_to_mentee_at then
    raise exception
      'released_to_mentee_at is write-once and immutable (evaluation %)',
      old.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sermon_evaluations_guard_release
  on public.sermon_evaluations;

create trigger sermon_evaluations_guard_release
  before update on public.sermon_evaluations
  for each row
  execute function public.sermon_evaluations_guard_release();

alter policy sermon_evaluations_select_own
  on public.sermon_evaluations
  using (
    owner_id = auth.uid()
    and (
      mentor_relationship_id is null
      or report_mode = 'debrief'
      or released_to_mentee_at is not null
      or not public.relationship_holds_evaluations(mentor_relationship_id)
    )
  );
