-- Two-tier plan_tier canon: coach | cohort (retire coach_plus).
-- Production (2026-05-27): 4 rows, all plan_tier = 'coach'; no data updates required.
--
-- Constraint name verified against Postgres default for inline column CHECK on create:
--   {table}_{column}_check → profiles_plan_tier_check
-- (see 20260525120000_profiles_and_sermon_evaluations.sql)

alter table public.profiles
  drop constraint profiles_plan_tier_check;

alter table public.profiles
  add constraint profiles_plan_tier_check
  check (plan_tier in ('coach', 'cohort'));
