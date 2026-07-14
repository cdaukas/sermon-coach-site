-- readiness_reads
-- Pre-sermon intake + generated read. One row per read.
-- sermon_id is nullable and set later, by the preacher, when he links a read to
-- the sermon he actually preached. It points at sermons, not sermon_evaluations:
-- a sermon can be evaluated more than once (sermon_versions), but he only did one
-- readiness read for it. sermons is also where user_id lives.

create table if not exists readiness_reads (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  sermon_id           uuid references sermons(id) on delete set null,

  -- intake
  -- named to match sermons.primary_passage; one vocabulary across the schema
  primary_passage     text,
  ache                text not null,
  big_idea            text not null,
  gospel_turn         text not null,
  points              text not null,
  one_person          text not null,
  ending              text not null,

  -- output
  read_output         text not null,
  prompt_version      text not null,

  -- telemetry (parsed from the fenced json block, stripped before render)
  mode                text check (mode in ('find', 'press')),
  status_ache         text check (status_ache        in ('solid','thin','seam')),
  status_big_idea     text check (status_big_idea    in ('solid','thin','seam')),
  status_gospel_turn  text check (status_gospel_turn in ('solid','thin','seam')),
  status_points       text check (status_points      in ('solid','thin','seam')),
  status_one_person   text check (status_one_person  in ('solid','thin','seam')),
  status_ending       text check (status_ending      in ('solid','thin','seam')),
  seam_a              text,
  seam_b              text,

  created_at          timestamptz not null default now()
);

create index if not exists readiness_reads_user_created_idx
  on readiness_reads (user_id, created_at desc);

create index if not exists readiness_reads_unlinked_idx
  on readiness_reads (user_id)
  where sermon_id is null;

-- RLS: a preacher sees only his own reads.
alter table readiness_reads enable row level security;

create policy "own reads: select"
  on readiness_reads for select
  using (auth.uid() = user_id);

create policy "own reads: insert"
  on readiness_reads for insert
  with check (auth.uid() = user_id);

create policy "own reads: update"
  on readiness_reads for update
  using (auth.uid() = user_id);
