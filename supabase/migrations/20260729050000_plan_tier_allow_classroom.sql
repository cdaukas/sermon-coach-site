-- plan_tier canon: coach | classroom (retire cohort).
-- Production (2026-07-29): applied by hand before this file landed in repo.
--
-- Constraint name verified against Postgres default for inline column CHECK on create:
--   {table}_{column}_check → profiles_plan_tier_check
-- (see 20260525120000_profiles_and_sermon_evaluations.sql)

alter table public.profiles
  drop constraint profiles_plan_tier_check;

alter table public.profiles
  add constraint profiles_plan_tier_check
  check (
    plan_tier = any (array['coach'::text, 'classroom'::text])
  );
