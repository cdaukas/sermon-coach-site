-- Blog email opt-outs (weekly teaser). Service role only.

create table public.email_suppressions (
  email            text primary key,
  unsubscribed_at  timestamptz not null default now(),
  reason           text not null default 'unsubscribe'
    check (reason in ('unsubscribe', 'manual', 'bounce', 'complaint'))
);

comment on table public.email_suppressions is
  'Emails opted out of weekly blog-teaser sends. Checked before every list-wide send.';

alter table public.email_suppressions enable row level security;

-- No client policies: only service role (bypasses RLS) reads/writes this table.
