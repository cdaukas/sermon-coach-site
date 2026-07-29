-- Allow mentors to stamp invite-email send metadata on their pending invites.
-- Column-scoped grant so session updates cannot touch other relationship fields.

grant update (invite_email_to, invite_email_sent_at)
  on public.mentor_relationships
  to authenticated;

create policy mentor_relationships_stamp_invite_email_as_mentor
  on public.mentor_relationships
  for update
  to authenticated
  using (mentor_id = (select auth.uid()) and status = 'pending')
  with check (mentor_id = (select auth.uid()) and status = 'pending');
