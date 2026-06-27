-- Manual: run in Supabase SQL editor after replacing __SERVICE_ROLE_KEY__ below.
-- Mirrors the lifecycle-welcome pg_net trigger (hardcoded bearer; alter database set is blocked on hosted Postgres).
-- Requires pg_net (already enabled for lifecycle-welcome).

create or replace function public.notify_lifecycle_first_eval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_role_key constant text := '__SERVICE_ROLE_KEY__';
begin
  perform net.http_post(
    url := 'https://gskxtjfzqaitcruhbwgq.supabase.co/functions/v1/lifecycle-first-eval',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists on_sermon_evaluation_updated_lifecycle_first_eval
  on public.sermon_evaluations;

create trigger on_sermon_evaluation_updated_lifecycle_first_eval
  after update on public.sermon_evaluations
  for each row
  execute function public.notify_lifecycle_first_eval();
