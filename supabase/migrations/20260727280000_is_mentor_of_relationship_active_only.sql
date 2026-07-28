-- Align mentor read membership with seat lifecycle: active only.

create or replace function public.is_mentor_of_relationship(
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
      and mr.mentor_id = auth.uid()
      and mr.status = 'active'
  );
$$;

revoke all on function public.is_mentor_of_relationship(uuid)
  from public;
grant execute on function public.is_mentor_of_relationship(uuid)
  to authenticated;

comment on function public.is_mentor_of_relationship(uuid) is
  'Reads mentor_relationships, which is deny-all under RLS, so this must be SECURITY DEFINER with a locked search_path. Mentor read access ends when the relationship ends; pending, ended, and revoked all deny. This matches the seat lifecycle decision for the mentee''s mentoring seat.';
