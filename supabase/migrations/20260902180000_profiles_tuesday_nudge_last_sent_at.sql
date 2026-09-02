-- Weekly Tuesday nudge send stamp. Used to block a same-week retry.
-- Applied by hand then repaired; do not supabase db push.

alter table public.profiles
  add column if not exists tuesday_nudge_last_sent_at timestamptz;

comment on column public.profiles.tuesday_nudge_last_sent_at is
  'When the Tuesday nudge email last sent successfully. Same UTC ISO week blocks a retry.';
