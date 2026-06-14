-- Optional preacher-provided primary passage on the sermon row (raw text; parsed later).

alter table public.sermons
  add column primary_passage text;

comment on column public.sermons.primary_passage is
  'Optional preacher-provided primary passage as raw text (e.g. Hebrews 12:5-17).';
