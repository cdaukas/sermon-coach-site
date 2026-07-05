-- Email-only blog subscribers (no auth account). Unioned with auth.users for Friday sends.

create table public.newsletter_subscribers (
  email          text primary key,
  subscribed_at  timestamptz not null default now(),
  source         text not null default 'unknown'
);

comment on table public.newsletter_subscribers is
  'Newsletter-only signups for the weekly blog teaser. Merged with auth.users at send time.';

alter table public.newsletter_subscribers enable row level security;

-- No client policies: POST /api/newsletter/subscribe uses service role only.
