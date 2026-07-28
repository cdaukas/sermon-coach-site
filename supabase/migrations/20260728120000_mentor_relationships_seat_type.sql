-- Which paid seat this mentoring relationship runs on.
-- Nullable first so existing rows can backfill, then NOT NULL.
-- No default: every insert must name the seat (same pattern as status).

alter table public.mentor_relationships
  add column seat_type text;

update public.mentor_relationships
set seat_type = 'evaluation'
where seat_type is null;

alter table public.mentor_relationships
  alter column seat_type set not null;

alter table public.mentor_relationships
  add constraint mentor_relationships_seat_type_check
  check (seat_type = any (array['debrief', 'evaluation']));

comment on column public.mentor_relationships.seat_type is
  'Which paid seat this relationship runs on. debrief ($12/mo) holds the mentee''s evaluations so he sees that one ran but not its content until release. evaluation ($25/mo) has no hold and the mentee reads his own evaluations normally. Deliberately no default so every insert names it. Mutable, since a mentor may upgrade a mentee from debrief to evaluation, which should release everything held.';
