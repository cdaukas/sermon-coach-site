-- One-time evaluation credit packs: grant ledger (schema + RLS only).

create table public.eval_credit_grants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  source              text not null check (source in ('pack_2', 'pack_6', 'pack_12')),
  quantity_total      integer not null check (quantity_total > 0),
  quantity_remaining  integer not null check (quantity_remaining >= 0),
  granted_at          timestamptz not null default now(),
  expires_at          timestamptz not null,
  stripe_payment_id   text not null unique,
  created_at          timestamptz not null default now()
);

create index idx_eval_credit_grants_user_active
  on public.eval_credit_grants (user_id, expires_at)
  where quantity_remaining > 0;

alter table public.eval_credit_grants enable row level security;

create policy "owners can read their own grants"
  on public.eval_credit_grants
  for select
  using (user_id = auth.uid());
