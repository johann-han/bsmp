create table if not exists public.billing_checkout_intents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_id uuid not null references public.subscription_plans(id) on delete restrict,
    provider text not null,
    payment_reference text not null,
    amount numeric(12,2) not null check (amount >= 0),
    currency text not null default 'ZAR',
    status text not null default 'pending' check (status in ('pending','completed','canceled','failed')),
    external_subscription_id text,
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    unique (provider, payment_reference)
);

create index if not exists billing_checkout_intents_user_created_at_idx
    on public.billing_checkout_intents(user_id, created_at desc);

create index if not exists billing_checkout_intents_provider_external_subscription_idx
    on public.billing_checkout_intents(provider, external_subscription_id)
    where external_subscription_id is not null;

alter table public.billing_checkout_intents enable row level security;
alter table public.billing_checkout_intents force row level security;

revoke all on public.billing_checkout_intents from anon, authenticated;
grant select on public.billing_checkout_intents to authenticated;

drop policy if exists billing_checkout_intents_select_own on public.billing_checkout_intents;
create policy billing_checkout_intents_select_own
    on public.billing_checkout_intents
    for select
    to authenticated
    using (user_id = auth.uid());

comment on table public.billing_checkout_intents is 'Server-created pending billing checkout references used to bind external payment notifications to an authenticated BSMP account and expected amount.';
