-- Allow 'revoked' as a mentor_relationships status.
-- ended = term completed normally; both parties retain read access
-- to work already done. revoked = access is cut.

alter table public.mentor_relationships
  drop constraint mentor_relationships_status_check;

alter table public.mentor_relationships
  add constraint mentor_relationships_status_check
  check (status = any (array['pending', 'active', 'ended', 'revoked']));

comment on constraint mentor_relationships_status_check
  on public.mentor_relationships is
  'ended means the term completed normally and both parties retain read access to work already done. revoked means access is cut; it is the only status that removes mentor read access.';
