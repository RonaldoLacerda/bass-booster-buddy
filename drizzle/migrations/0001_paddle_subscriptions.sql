alter table public.subscriptions
  add column if not exists paddle_subscription_id text unique,
  add column if not exists paddle_customer_id text,
  add column if not exists price_id text,
  add column if not exists paddle_status text,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists environment text,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);