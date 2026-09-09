-- Per-criterion close compliance at scores 4 and 5.
-- Instrument of record for the §7 hedge removal.
-- Baseline 8 Sept on v3.5: n=1,794, missing=209, 11.6% overall.
-- Range 7.0% (criterion 6) to 15.2% (criterion 11).
-- Re-run with prompt_version = 'v3.6' after deploy.
with crit as (
  select
    e.prompt_version,
    (c->>'id')::int    as crit_id,
    (c->>'score')::int as score,
    c->>'narrative'    as narrative
  from sermon_evaluations e,
       jsonb_array_elements(e.result->'categories') cat,
       jsonb_array_elements(cat->'criteria') c
  where e.status = 'complete'
    and coalesce(e.output_language,'en') = 'en'
    and c->>'narrative' is not null
)
select
  crit_id,
  count(*) as n,
  count(*) filter (where narrative !~* '(to reach a|to hold this)') as missing,
  round(100.0 * count(*) filter (
    where narrative !~* '(to reach a|to hold this)') / count(*), 1) as pct_missing
from crit
where score in (4,5)
  and prompt_version = 'v3.5'
group by crit_id
order by crit_id;
