-- Per-account visibility of the report Methodology block. Presentation only.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260904120000
--
-- The block is static template copy in MethodologySection.tsx. Nothing here
-- touches scoring, the rubric, or the sermon_evaluations schema. The flag is
-- read live at render time; it is never written onto an evaluation row.

alter table public.profiles
  add column if not exists include_methodology_in_reports boolean not null default true;

-- Existing rows are backfilled explicitly rather than relying on the column
-- default, so evaluations created before this migration keep the block on.
update public.profiles
set include_methodology_in_reports = true
where include_methodology_in_reports is distinct from true;

comment on column public.profiles.include_methodology_in_reports is
  'Account setting for the Methodology section at the end of the evaluation report and eval PDF. True by default and backfilled true. Read live at render time from the viewer''s own profile; never stamped onto sermon_evaluations. Presentation only; does not affect scoring.';

create or replace function public.set_report_preferences(
  p_include_methodology boolean
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

  update public.profiles
  set include_methodology_in_reports = coalesce(p_include_methodology, true)
  where id = auth.uid();
end;
$$;

revoke all on function public.set_report_preferences(boolean) from public, anon;
grant execute on function public.set_report_preferences(boolean) to authenticated;

comment on function public.set_report_preferences(boolean) is
  'Account page writer for include_methodology_in_reports. profiles has no UPDATE policy so this must be SECURITY DEFINER. Writes for auth.uid() only. Coalesces null to true, matching the column default. Separate from set_email_preferences so the email signature stays stable.';
