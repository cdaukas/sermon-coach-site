-- Track invite email sends so a resend is not silently duplicated.
-- Mirrors the column-stamp dedup pattern used by welcome_sent_at,
-- first_evaluation_at, and onboarding_nudge_sent_at.

alter table public.mentor_relationships
  add column invite_email_to text,
  add column invite_email_sent_at timestamptz;
