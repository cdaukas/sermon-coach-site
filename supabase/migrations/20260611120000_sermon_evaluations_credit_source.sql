-- Tag each evaluation with how it was authorized at gate time (free, subscription, or pack).

alter table public.sermon_evaluations
  add column credit_source text
  check (credit_source is null or credit_source in ('free', 'subscription', 'pack'));

comment on column public.sermon_evaluations.credit_source is
  'How this evaluation was authorized at gate time (free, subscription, or pack).';
