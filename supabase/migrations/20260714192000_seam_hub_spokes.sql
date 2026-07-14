-- Replace the two-ended seam model with hub-and-spokes.
--
-- Why: a seam is a disagreement, and one area often disagrees with several others
-- at once. seam_a / seam_b forced the model to report exactly one pair, so when an
-- ending drifted from the gospel turn AND the one person AND the big idea, it
-- picked one arbitrarily. Four runs of the same intake produced three different
-- pairs -- but the same hub every time. The hub was stable; only the reported spoke
-- moved. This schema stops asking the model to arbitrate.
--
-- seam_hub    = the one area to fix
-- seam_spokes = every area the hub disagrees with (never contains the hub)

alter table readiness_reads
  drop column if exists seam_a,
  drop column if exists seam_b;

alter table readiness_reads
  add column if not exists seam_hub    text,
  add column if not exists seam_spokes text[];

-- The hub, when present, is one of the six areas.
alter table readiness_reads
  add constraint readiness_reads_seam_hub_valid
  check (
    seam_hub is null
    or seam_hub in ('ache','big_idea','gospel_turn','points','one_person','ending')
  );

-- A seam needs a hub AND at least one spoke, or it is not a seam.
-- mode 'press' means no seam at all.
alter table readiness_reads
  add constraint readiness_reads_seam_coherent
  check (
    (mode = 'press' and seam_hub is null and seam_spokes is null)
    or (mode = 'find' and seam_hub is not null
        and seam_spokes is not null and array_length(seam_spokes, 1) >= 1)
    or mode is null
  );

-- Find the preachers whose endings keep coming apart:
--   select seam_hub, count(*) from readiness_reads group by 1 order by 2 desc;
create index if not exists readiness_reads_seam_hub_idx
  on readiness_reads (seam_hub)
  where seam_hub is not null;
