-- Manual: run in Supabase SQL editor after replacing __SERVICE_ROLE_KEY__ below.
-- Use the Supabase service role key (sb_secret_… or JWT), NOT the Resend API key (re_…).
-- pg_net already enabled from the welcome trigger; harmless to repeat.

create extension if not exists pg_net;

create or replace function public.fire_first_eval_email()
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
      'table', 'sermon_evaluations',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists on_first_eval_complete on public.sermon_evaluations;

create trigger on_first_eval_complete
  after update on public.sermon_evaluations
  for each row
  when (OLD.status is distinct from NEW.status and NEW.status = 'complete')
  execute function public.fire_first_eval_email();
