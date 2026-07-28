-- SECURITY DEFINER membership helper for mentor read policies.
-- mentor_relationships is deny-all under RLS; a plain EXISTS from a
-- sermon_evaluations policy would always return false.

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
      and mr.status <> 'revoked'
  );
$$;

revoke all on function public.is_mentor_of_relationship(uuid)
  from public;
grant execute on function public.is_mentor_of_relationship(uuid)
  to authenticated;

comment on function public.is_mentor_of_relationship(uuid) is
  'Reads mentor_relationships, which is deny-all under RLS, so this must be SECURITY DEFINER with a locked search_path. Returns true only for the mentor on a relationship that is not revoked. Deliberately does not check for active so that a mentor keeps read access to work already done after a term ends.';
