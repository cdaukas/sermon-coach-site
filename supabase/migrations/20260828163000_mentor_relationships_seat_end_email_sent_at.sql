-- Stamp for the seat-end email to the mentee. Same pattern as
-- invite_email_sent_at: nullable, set after a successful send, skip if set.
-- Apply by hand in the Supabase SQL editor. Do not supabase db push.
-- After apply: supabase migration repair --status applied 20260828163000

alter table public.mentor_relationships
  add column if not exists seat_end_email_sent_at timestamptz;

comment on column public.mentor_relationships.seat_end_email_sent_at is
  'When the seat-end email was sent to the mentee. Null means not sent. Set after a successful Resend send so a retry does not duplicate.';
