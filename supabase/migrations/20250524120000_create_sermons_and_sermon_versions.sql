-- Step 5: sermons + sermon_versions with RLS

create table public.sermons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null check (char_length(trim(title)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sermons_user_id_created_at_idx
  on public.sermons (user_id, created_at desc);

alter table public.sermons enable row level security;

create policy "sermons_select_own"
  on public.sermons
  for select
  using (user_id = auth.uid());

create policy "sermons_insert_own"
  on public.sermons
  for insert
  with check (user_id = auth.uid());

create policy "sermons_update_own"
  on public.sermons
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "sermons_delete_own"
  on public.sermons
  for delete
  using (user_id = auth.uid());

create table public.sermon_versions (
  id             uuid primary key default gen_random_uuid(),
  sermon_id      uuid not null references public.sermons (id) on delete cascade,
  content        text not null check (char_length(trim(content)) > 0),
  version_number int  not null default 1 check (version_number >= 1),
  created_at     timestamptz not null default now(),

  unique (sermon_id, version_number)
);

create index sermon_versions_sermon_id_idx
  on public.sermon_versions (sermon_id);

create index sermon_versions_sermon_id_created_at_idx
  on public.sermon_versions (sermon_id, created_at desc);

alter table public.sermon_versions enable row level security;

create policy "sermon_versions_select_own"
  on public.sermon_versions
  for select
  using (
    exists (
      select 1
      from public.sermons s
      where s.id = sermon_versions.sermon_id
        and s.user_id = auth.uid()
    )
  );

create policy "sermon_versions_insert_own"
  on public.sermon_versions
  for insert
  with check (
    exists (
      select 1
      from public.sermons s
      where s.id = sermon_versions.sermon_id
        and s.user_id = auth.uid()
    )
  );

create policy "sermon_versions_update_own"
  on public.sermon_versions
  for update
  using (
    exists (
      select 1
      from public.sermons s
      where s.id = sermon_versions.sermon_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sermons s
      where s.id = sermon_versions.sermon_id
        and s.user_id = auth.uid()
    )
  );

create policy "sermon_versions_delete_own"
  on public.sermon_versions
  for delete
  using (
    exists (
      select 1
      from public.sermons s
      where s.id = sermon_versions.sermon_id
        and s.user_id = auth.uid()
    )
  );
