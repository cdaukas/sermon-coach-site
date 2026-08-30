-- Vocabulary-only flag for hand-provisioned Teams accounts.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260830021500
-- Set by hand when provisioning a team. There is no UI for this column.

alter table public.profiles
  add column if not exists is_team_account boolean not null default false;

comment on column public.profiles.is_team_account is
  'Hand-set. When true, Mentoring surfaces read as Teams. Labels only; no entitlement.';
