-- Record complimentary Apprentice seats for grandfathered Coach subscribers.
--
-- Context: When Mentoring Debrief was removed from the Coach subscription,
-- every profile with subscription_status = 'active' was promised one free
-- Apprentice (debrief) seat. That promise lived only in human process until
-- this column. create_mentor_invite still has no seat-purchase entitlement
-- check; when that check lands (tier 3.1), it must read
-- profiles.comp_debrief_seats before Stripe so these mentors never hit a
-- paywall on a gift they already hold.
--
-- Entitlement at 3.1:
--   pending + active debrief <= purchased + profiles.comp_debrief_seats
--   (comp before Stripe)
--
-- Policy (decided 2026-08-04, state at first purchasable seats):
--   * Permanent capacity, not a timed monthly grant and not a one-shot burn
--     token. One complimentary Apprentice seat may be held/reassigned as long
--     as the product uses this column. It does not expire by calendar.
--   * Applies only to seat_type = debrief. Does not grant Colleague seats.
--   * Purchased seats stack on top of this capacity in the future check.
--   * Client has no UPDATE on profiles; only service_role / security definer
--     writes. Do not expose a client path to increment this.
--
-- Backfill: all profiles currently active on Coach (the promised cohort at
-- migration time). Confirm count against the known ten before apply. New
-- active Coach signups after this migration get 0 unless a later ops grant
-- is written explicitly.

alter table public.profiles
  add column if not exists comp_debrief_seats integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_comp_debrief_seats_check;

alter table public.profiles
  add constraint profiles_comp_debrief_seats_check
  check (comp_debrief_seats >= 0);

comment on column public.profiles.comp_debrief_seats is
  'Complimentary Apprentice (seat_type=debrief) seat capacity granted outside Stripe. Permanent reassignable capacity (not monthly, does not expire). Grandfathered 1 for Coach subscribers who were active when Mentoring Debrief left Coach. Future create_mentor_invite entitlement: pending+active debrief <= purchased + this column; check this before Stripe. Service role / security definer writes only.';

-- One-time grandfather grant: active Coach at migration apply time.
update public.profiles
set comp_debrief_seats = greatest(comp_debrief_seats, 1)
where subscription_status = 'active'
  and plan_tier = 'coach';
