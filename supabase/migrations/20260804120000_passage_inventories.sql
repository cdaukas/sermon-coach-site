-- passage_inventories
-- Offline, passage-keyed exegetical inventory for shadow measurement against
-- stored evaluations. Not on the evaluation request path. Keyed by normalized
-- passage reference so the same inventory serves every preacher of that text.

create table if not exists public.passage_inventories (
  id                        uuid primary key default gen_random_uuid(),
  passage_ref_raw           text not null,
  passage_ref_normalized    text not null,
  argument                  text,
  hinge                     text,
  load_bearing              text[],
  contested_cruxes          jsonb,
  original_language_terms   jsonb,
  redemptive_elements       text[],
  burden                    text,
  model                     text not null,
  prompt_version            text not null,
  created_at                timestamptz not null default now(),
  unique (passage_ref_normalized, prompt_version)
);

comment on table public.passage_inventories is
  'Passage-first exegetical inventory (shadow mode). Generated offline; never consumed by the live evaluation path.';

comment on column public.passage_inventories.passage_ref_raw is
  'Passage as the preacher (or operator) supplied it before normalization.';

comment on column public.passage_inventories.passage_ref_normalized is
  'Canonical key: full English book name; whole chapter (Hebrews 3), same-chapter range (Hebrews 3:1-6), or cross-chapter range (1 Corinthians 10:31-11:1). Single-chapter books use explicit 1:verse form (2 John 1:1-13).';

comment on column public.passage_inventories.contested_cruxes is
  'jsonb array of { crux, positions[], why_it_matters }. Variable-length structured list; not flattened.';

comment on column public.passage_inventories.original_language_terms is
  'jsonb array of { term, gloss, semantic_range, overreach_risk }. Variable-length structured list; not flattened.';

create index if not exists passage_inventories_normalized_idx
  on public.passage_inventories (passage_ref_normalized);

-- Service-role scripts only for now (no user-facing surface). RLS on, zero
-- policies: authenticated clients cannot read/write; service_role bypasses RLS.
alter table public.passage_inventories enable row level security;
