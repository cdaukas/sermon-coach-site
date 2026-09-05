-- Sermon purge cron: service_role reaches archive only through SECURITY DEFINER
-- RPCs below. Do NOT add archive to PostgREST exposed schemas.
-- anon / authenticated stay revoked on the archive table and on these functions.

grant usage on schema archive to service_role;
grant select, insert, delete on archive._admin_row_archive to service_role;

-- ---------------------------------------------------------------------------
-- One sermon, one transaction: archive → count-verify → null readiness → delete
-- ---------------------------------------------------------------------------
create or replace function public.purge_soft_deleted_sermon(
  p_sermon_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sermon public.sermons%rowtype;
  v_version_ids uuid[];
  v_evaluation_ids uuid[];
  v_version_count integer;
  v_evaluation_count integer;
  v_archived_evaluations integer;
  v_archived_versions integer;
  v_archived_sermons integer;
  v_readiness_ids uuid[];
  v_deleted_evaluations integer;
  v_deleted_versions integer;
  v_deleted_sermons integer;
begin
  if p_sermon_id is null then
    raise exception 'purge_soft_deleted_sermon: p_sermon_id is required';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'purge_soft_deleted_sermon: p_reason is required';
  end if;

  select *
  into v_sermon
  from public.sermons
  where id = p_sermon_id
  for update;

  if not found then
    raise exception 'purge_soft_deleted_sermon: sermon % not found', p_sermon_id;
  end if;

  if v_sermon.deleted_at is null then
    raise exception
      'purge_soft_deleted_sermon: sermon % is not soft-deleted',
      p_sermon_id;
  end if;

  if v_sermon.deleted_at >= now() - interval '30 days' then
    raise exception
      'purge_soft_deleted_sermon: sermon % is inside the 30-day retention window (deleted_at %)',
      p_sermon_id,
      v_sermon.deleted_at;
  end if;

  select coalesce(array_agg(v.id order by v.id), '{}'::uuid[])
  into v_version_ids
  from public.sermon_versions v
  where v.sermon_id = p_sermon_id;

  v_version_count := coalesce(cardinality(v_version_ids), 0);

  if v_version_count = 0 then
    v_evaluation_ids := '{}'::uuid[];
  else
    select coalesce(array_agg(e.id order by e.id), '{}'::uuid[])
    into v_evaluation_ids
    from public.sermon_evaluations e
    where e.sermon_version_id = any (v_version_ids);
  end if;

  v_evaluation_count := coalesce(cardinality(v_evaluation_ids), 0);

  -- Skip-guards (route also evaluates these for report-only logging)
  if exists (
    select 1
    from public.sermon_evaluations e
    where e.id = any (v_evaluation_ids)
      and (
        e.is_public_sample is true
        or e.mentor_relationship_id is not null
        or (
          e.status is distinct from 'complete'
          and e.status is distinct from 'failed'
        )
      )
  ) then
    raise exception
      'purge_soft_deleted_sermon: sermon % tripped a skip-guard (public sample, mentored, or non-terminal status)',
      p_sermon_id;
  end if;

  -- Archive evaluations
  insert into archive._admin_row_archive (
    archived_at,
    reason,
    source_table,
    row_data
  )
  select
    now(),
    p_reason,
    'sermon_evaluations',
    to_jsonb(e)
  from public.sermon_evaluations e
  where e.id = any (v_evaluation_ids);

  get diagnostics v_archived_evaluations = row_count;

  -- Archive versions
  insert into archive._admin_row_archive (
    archived_at,
    reason,
    source_table,
    row_data
  )
  select
    now(),
    p_reason,
    'sermon_versions',
    to_jsonb(v)
  from public.sermon_versions v
  where v.id = any (v_version_ids);

  get diagnostics v_archived_versions = row_count;

  -- Archive sermon
  insert into archive._admin_row_archive (
    archived_at,
    reason,
    source_table,
    row_data
  )
  values (
    now(),
    p_reason,
    'sermons',
    to_jsonb(v_sermon)
  );

  get diagnostics v_archived_sermons = row_count;

  if v_archived_evaluations is distinct from v_evaluation_count
     or v_archived_versions is distinct from v_version_count
     or v_archived_sermons is distinct from 1 then
    raise exception
      'purge_soft_deleted_sermon: archive count mismatch for sermon % (evals %/%, versions %/%, sermons %/1)',
      p_sermon_id,
      v_archived_evaluations,
      v_evaluation_count,
      v_archived_versions,
      v_version_count,
      v_archived_sermons;
  end if;

  -- Explicit readiness unlink (do not rely on ON DELETE SET NULL)
  with cleared as (
    update public.readiness_reads r
    set sermon_id = null
    where r.sermon_id = p_sermon_id
    returning r.id
  )
  select coalesce(array_agg(cleared.id order by cleared.id), '{}'::uuid[])
  into v_readiness_ids
  from cleared;

  -- Delete evaluations, then versions, then sermon — explicit id lists only
  if v_evaluation_count > 0 then
    delete from public.sermon_evaluations e
    where e.id = any (v_evaluation_ids);
    get diagnostics v_deleted_evaluations = row_count;
    if v_deleted_evaluations is distinct from v_evaluation_count then
      raise exception
        'purge_soft_deleted_sermon: evaluation delete mismatch for sermon % (%/%)',
        p_sermon_id,
        v_deleted_evaluations,
        v_evaluation_count;
    end if;
  end if;

  if v_version_count > 0 then
    delete from public.sermon_versions v
    where v.id = any (v_version_ids);
    get diagnostics v_deleted_versions = row_count;
    if v_deleted_versions is distinct from v_version_count then
      raise exception
        'purge_soft_deleted_sermon: version delete mismatch for sermon % (%/%)',
        p_sermon_id,
        v_deleted_versions,
        v_version_count;
    end if;
  end if;

  delete from public.sermons s
  where s.id = p_sermon_id;
  get diagnostics v_deleted_sermons = row_count;
  if v_deleted_sermons is distinct from 1 then
    raise exception
      'purge_soft_deleted_sermon: sermon delete mismatch for sermon % (%/%)',
      p_sermon_id,
      v_deleted_sermons,
      1;
  end if;

  return jsonb_build_object(
    'sermon_id', p_sermon_id,
    'owner_id', v_sermon.user_id,
    'title', v_sermon.title,
    'deleted_at', v_sermon.deleted_at,
    'reason', p_reason,
    'evaluation_count', v_evaluation_count,
    'version_count', v_version_count,
    'evaluation_ids', to_jsonb(v_evaluation_ids),
    'version_ids', to_jsonb(v_version_ids),
    'readiness_reads_cleared', to_jsonb(v_readiness_ids)
  );
end;
$$;

revoke all on function public.purge_soft_deleted_sermon(uuid, text)
  from public;
revoke all on function public.purge_soft_deleted_sermon(uuid, text)
  from anon, authenticated;
grant execute on function public.purge_soft_deleted_sermon(uuid, text)
  to service_role;

comment on function public.purge_soft_deleted_sermon(uuid, text) is
  'Hard-purge one soft-deleted sermon in a single transaction after enforcing the 30-day window and skip-guards. Archives rows, verifies counts, nulls readiness_reads.sermon_id, deletes evaluations then versions then sermon. Service-role cron only.';

-- ---------------------------------------------------------------------------
-- Seven-day archive retention sweep
-- ---------------------------------------------------------------------------
create or replace function public.purge_sermon_archive_sweep(
  p_older_than timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if p_older_than is null then
    raise exception 'purge_sermon_archive_sweep: p_older_than is required';
  end if;

  delete from archive._admin_row_archive a
  where a.archived_at < p_older_than
    and a.reason like 'purge %';

  get diagnostics v_deleted = row_count;

  return jsonb_build_object(
    'deleted_count', v_deleted,
    'older_than', p_older_than
  );
end;
$$;

revoke all on function public.purge_sermon_archive_sweep(timestamptz)
  from public;
revoke all on function public.purge_sermon_archive_sweep(timestamptz)
  from anon, authenticated;
grant execute on function public.purge_sermon_archive_sweep(timestamptz)
  to service_role;

comment on function public.purge_sermon_archive_sweep(timestamptz) is
  'Deletes archive._admin_row_archive rows older than p_older_than whose reason starts with ''purge ''. Leaves non-purge archive rows (e.g. incident containment) untouched. Service-role cron only. Archive schema stays unexposed to PostgREST.';
