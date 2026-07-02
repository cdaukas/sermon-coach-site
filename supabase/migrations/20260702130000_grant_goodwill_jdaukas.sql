-- Founder goodwill comp: 6 perpetual evaluation credits for jdaukas@live.com

insert into public.eval_credit_grants (
  user_id,
  source,
  quantity_total,
  quantity_remaining,
  expires_at,
  stripe_payment_id
) values (
  '645ce2c8-39a6-43fe-ba7e-e4cc79502c0f',
  'goodwill',
  6,
  6,
  null,
  'manual-goodwill-jdaukas-2026-07-02'
) on conflict (stripe_payment_id) do nothing;
