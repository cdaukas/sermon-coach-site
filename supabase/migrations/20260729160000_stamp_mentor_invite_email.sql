-- Stamp invite-email send metadata. SECURITY DEFINER so no UPDATE grant is
-- needed on mentor_relationships, and so dedup plus the rate limit are
-- enforced in the same transaction as the write rather than in app code.

create or replace function public.stamp_mentor_invite_email(
  p_token text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rel public.mentor_relationships%rowtype;
  v_recent int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error_code', 'not_authenticated');
  end if;

  if p_email is null or btrim(p_email) = '' then
    return jsonb_build_object('ok', false, 'error_code', 'missing_email');
  end if;

  select * into v_rel
  from public.mentor_relationships
  where invite_token = p_token
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error_code', 'invalid_token');
  end if;

  if v_rel.mentor_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error_code', 'not_your_invite');
  end if;

  if v_rel.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error_code', 'not_pending');
  end if;

  if v_rel.invite_email_sent_at is not null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'already_sent',
      'sent_to', v_rel.invite_email_to
    );
  end if;

  select count(*) into v_recent
  from public.mentor_relationships
  where mentor_id = auth.uid()
    and invite_email_sent_at > now() - interval '24 hours';

  if v_recent >= 10 then
    return jsonb_build_object('ok', false, 'error_code', 'rate_limited');
  end if;

  update public.mentor_relationships
  set invite_email_to = btrim(p_email),
      invite_email_sent_at = now()
  where id = v_rel.id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.stamp_mentor_invite_email(text, text) from public;
revoke all on function public.stamp_mentor_invite_email(text, text) from anon;
grant execute on function public.stamp_mentor_invite_email(text, text) to authenticated;
