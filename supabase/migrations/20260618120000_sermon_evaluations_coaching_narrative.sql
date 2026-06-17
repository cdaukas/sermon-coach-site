-- Cached coaching narrative prose (generated once after scoring for coaching-mode evals).

alter table public.sermon_evaluations
  add column coaching_narrative jsonb;

comment on column public.sermon_evaluations.coaching_narrative is
  'Validated coaching report blocks (lead_with_this, how_to_grow, what_it_looks_like); null for diagnostic mode or before generation.';
