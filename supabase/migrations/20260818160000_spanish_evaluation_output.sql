-- Gated Spanish evaluation output.
-- profiles.spanish_enabled is flipped in Supabase (no product UI).
-- sermon_evaluations.output_language is per evaluation (en default).

alter table public.profiles
  add column if not exists spanish_enabled boolean not null default false;

comment on column public.profiles.spanish_enabled is
  'Manual allowlist for Spanish evaluation output. Default false. No product UI; set in Supabase.';

alter table public.sermon_evaluations
  add column if not exists output_language text not null default 'en';

alter table public.sermon_evaluations
  drop constraint if exists sermon_evaluations_output_language_check;

alter table public.sermon_evaluations
  add constraint sermon_evaluations_output_language_check
  check (output_language in ('en', 'es'));

comment on column public.sermon_evaluations.output_language is
  'Language of generated evaluation prose. en default. es only for spanish_enabled accounts on the coach upload path.';
