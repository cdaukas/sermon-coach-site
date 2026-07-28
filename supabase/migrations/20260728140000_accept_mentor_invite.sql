-- Historical reconciliation: accept_mentor_invite as already live in production.
-- Do not modify; this records the existing SECURITY DEFINER definition on disk.

CREATE OR REPLACE FUNCTION public.accept_mentor_invite(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token text := nullif(btrim(coalesce(p_token, '')), '');
  v_row   public.mentor_relationships%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'not_authenticated',
      'relationship_id', null
    );
  end if;

  if v_token is null then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used',
      'relationship_id', null
    );
  end if;

  select *
  into v_row
  from public.mentor_relationships
  where invite_token = v_token
  for update;

  if not found or v_row.status is distinct from 'pending' then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'invalid_or_used',
      'relationship_id', null
    );
  end if;

  if v_row.mentor_id = auth.uid() then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'self_invite',
      'relationship_id', null
    );
  end if;

  if exists (
    select 1
    from public.mentor_relationships
    where mentee_id = auth.uid()
      and status = 'active'
  ) then
    return jsonb_build_object(
      'ok', false,
      'error_code', 'already_mentored',
      'relationship_id', null
    );
  end if;

  begin
    update public.mentor_relationships
    set
      mentee_id = auth.uid(),
      status = 'active',
      period_started_at = now(),
      accepted_at = now()
    where id = v_row.id
      and status = 'pending';

    if not found then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'invalid_or_used',
        'relationship_id', null
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'error_code', null,
      'relationship_id', v_row.id
    );
  exception
    when unique_violation then
      return jsonb_build_object(
        'ok', false,
        'error_code', 'already_mentored',
        'relationship_id', null
      );
  end;
end;
$function$
