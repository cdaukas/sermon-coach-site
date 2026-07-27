-- Allow authed Sketch daily-limit events on sketch_rate_events.
-- For action = 'authed_run', the `ip` column stores auth.users.id (subject key),
-- not a network address. Keeps one events table without mixing into public
-- run/save sitewide counters.

alter table public.sketch_rate_events
  drop constraint if exists sketch_rate_events_action_check;

alter table public.sketch_rate_events
  add constraint sketch_rate_events_action_check
  check (action in ('run', 'save', 'authed_run'));
