-- Per-account report language preference. Copied onto sermon_evaluations.output_language
-- at evaluation creation. Stored evaluations and PDFs keep reading the evaluation row.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260904180000
--
-- profiles.spanish_enabled is left in place and unread. Dropping it is a separate branch.

alter table public.profiles
  add column if not exists report_language text;

alter table public.profiles
  drop constraint if exists profiles_report_language_check;

alter table public.profiles
  add constraint profiles_report_language_check
  check (report_language is null or report_language in ('en', 'es'));

-- Backfill from the admin gate, then lock the column.
update public.profiles
set report_language = case
  when spanish_enabled is true then 'es'
  else 'en'
end
where report_language is null;

alter table public.profiles
  alter column report_language set default 'en';

alter table public.profiles
  alter column report_language set not null;

comment on column public.profiles.report_language is
  'Account preference for the language of newly generated evaluation reports. en or es. Copied onto sermon_evaluations.output_language at creation. Existing rows keep their stamped language. Replaces product use of spanish_enabled; that column remains unread until a later drop.';

create or replace function public.set_report_language(
  p_report_language text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_report_language not in ('en', 'es') then
    raise exception 'unsupported report language: %', p_report_language;
  end if;

  update public.profiles
  set report_language = p_report_language
  where id = auth.uid();
end;
$$;

revoke all on function public.set_report_language(text) from public, anon;
grant execute on function public.set_report_language(text) to authenticated;

comment on function public.set_report_language(text) is
  'Account page writer for report_language. profiles has no UPDATE policy so this must be SECURITY DEFINER. Writes for auth.uid() only. Raises on any value other than en or es.';
