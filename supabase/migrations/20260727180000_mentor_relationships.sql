-- Develop-Others Phase 1: mentor↔mentee relationships + invite/accept RPCs.
-- RLS locked (no permissive policies). Access via SECURITY DEFINER RPCs only.
-- Quota caps and mentor/mentee read policies come in Phase 2.

create table public.mentor_relationships (
  id                          uuid primary key default gen_random_uuid(),
  mentor_id                   uuid not null references auth.users (id) on delete cascade,
  mentee_id                   uuid references auth.users (id) on delete cascade,
  invite_token                text not null unique,
  status                      text not null
                              check (status in ('pending', 'active', 'ended')),
  period_days                 int not null default 120,
  period_started_at           timestamptz,
  debriefs_used_this_period   int not null default 0,
  evals_triggered_this_period int not null default 0,
  created_at                  timestamptz not null default now(),
  accepted_at                 timestamptz,
  ended_at                    timestamptz
);

comment on column public.mentor_relationships.period_days is
  'Length of one mentoring semester in days. Tunable per relationship; never hardcode 120 in app logic.';

-- One active mentor per mentee. Partial so ended relationships do not block re-entry.
create unique index mentor_relationships_one_active_mentee
  on public.mentor_relationships (mentee_id)
  where status = 'active';

create index mentor_relationships_mentor_id_idx
  on public.mentor_relationships (mentor_id);

alter table public.mentor_relationships enable row level security;

revoke all on public.mentor_relationships from anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_mentor_invite: authenticated mentor mints a pending invite token
-- ---------------------------------------------------------------------------

create or replace function public.create_mentor_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_token := gen_random_uuid()::text;

  insert into public.mentor_relationships (
    mentor_id,
    invite_token,
    status
  ) values (
    auth.uid(),
    v_token,
    'pending'
  );

  return v_token;
end;
$$;

revoke all on function public.create_mentor_invite() from public, anon;
grant execute on function public.create_mentor_invite() to authenticated;

-- ---------------------------------------------------------------------------
-- accept_mentor_invite: authenticated mentee accepts; structured result
-- ---------------------------------------------------------------------------

create or replace function public.accept_mentor_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.accept_mentor_invite(text) from public, anon;
grant execute on function public.accept_mentor_invite(text) to authenticated;
