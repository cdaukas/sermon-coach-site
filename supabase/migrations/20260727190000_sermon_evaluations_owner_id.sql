-- Denormalize ownership onto sermon_evaluations so RLS can key on
-- owner_id = auth.uid() instead of the two-hop join through
-- sermon_versions -> sermons.
--
-- The BEFORE INSERT OR UPDATE trigger always recomputes owner_id from
-- sermon_version_id. That is a security control: without it, a client
-- could supply their own owner_id and a foreign sermon_version_id and
-- pass owner_id = auth.uid().

-- 1. Add nullable column (NOT NULL against 86 existing rows would fail).
alter table public.sermon_evaluations
  add column owner_id uuid references auth.users (id);

-- 2. Backfill from the existing ownership chain.
update public.sermon_evaluations e
set owner_id = s.user_id
from public.sermon_versions v
join public.sermons s on s.id = v.sermon_id
where v.id = e.sermon_version_id;

-- 3. Guard (run manually before the NOT NULL step if applying piecewise):
-- select count(*) from sermon_evaluations where owner_id is null;
-- Expected: 0. If non-zero, stop and do not apply the rest.

-- 4. Require owner_id going forward.
alter table public.sermon_evaluations
  alter column owner_id set not null;

-- 5. Index for owner-scoped lookups and RLS.
create index sermon_evaluations_owner_id_idx
  on public.sermon_evaluations (owner_id);

-- 6–8. Trigger (security control) + policy swap in one transaction so
-- owner_id = auth.uid() is never live without the recompute trigger.
begin;

create or replace function public.sermon_evaluations_resolve_owner_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved uuid;
begin
  select s.user_id
    into resolved
  from public.sermon_versions v
  join public.sermons s on s.id = v.sermon_id
  where v.id = new.sermon_version_id;

  if resolved is null then
    raise exception
      'sermon_evaluations: cannot resolve owner_id for sermon_version_id %',
      new.sermon_version_id;
  end if;

  -- Always recompute; ignore any client-supplied owner_id.
  new.owner_id := resolved;
  return new;
end;
$$;

drop trigger if exists sermon_evaluations_resolve_owner_id
  on public.sermon_evaluations;

-- Fires on INSERT and on UPDATE of sermon_version_id or owner_id.
-- Updates that touch neither column (status, result, tokens) do not
-- fire it. That is intentional: owner_id cannot change unless one of
-- those two columns is being written.
create trigger sermon_evaluations_resolve_owner_id
  before insert or update of sermon_version_id, owner_id
  on public.sermon_evaluations
  for each row
  execute function public.sermon_evaluations_resolve_owner_id();

drop policy if exists "sermon_evaluations_select_own" on public.sermon_evaluations;
drop policy if exists "sermon_evaluations_insert_own" on public.sermon_evaluations;
drop policy if exists "sermon_evaluations_update_own" on public.sermon_evaluations;
drop policy if exists "sermon_evaluations_delete_own" on public.sermon_evaluations;

create policy "sermon_evaluations_select_own"
  on public.sermon_evaluations
  for select
  using (owner_id = auth.uid());

create policy "sermon_evaluations_insert_own"
  on public.sermon_evaluations
  for insert
  with check (owner_id = auth.uid());

create policy "sermon_evaluations_update_own"
  on public.sermon_evaluations
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "sermon_evaluations_delete_own"
  on public.sermon_evaluations
  for delete
  using (owner_id = auth.uid());

commit;
