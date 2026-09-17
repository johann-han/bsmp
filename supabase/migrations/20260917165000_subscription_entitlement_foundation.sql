create table if not exists public.subscription_plans (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    description text not null default '',
    active boolean not null default true,
    display_order integer not null default 0,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plan_entitlements (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.subscription_plans(id) on delete cascade,
    entitlement_key text not null,
    enabled boolean not null default true,
    limit_value numeric(20,6),
    limit_unit text not null default 'count',
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (plan_id, entitlement_key)
);

create table if not exists public.user_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_id uuid not null references public.subscription_plans(id) on delete restrict,
    status text not null default 'active' check (status in ('trialing','active','past_due','paused','canceled','incomplete')),
    provider text not null default 'manual',
    external_customer_id text,
    external_subscription_id text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists user_subscriptions_one_active_per_user_idx
    on public.user_subscriptions(user_id)
    where status in ('trialing','active','past_due','paused','incomplete');

create unique index if not exists user_subscriptions_provider_external_subscription_idx
    on public.user_subscriptions(provider, external_subscription_id)
    where external_subscription_id is not null;

create index if not exists subscription_plan_entitlements_plan_idx
    on public.subscription_plan_entitlements(plan_id);

create index if not exists user_subscriptions_user_idx
    on public.user_subscriptions(user_id, created_at desc);

alter table public.subscription_plans enable row level security;
alter table public.subscription_plan_entitlements enable row level security;
alter table public.user_subscriptions enable row level security;

alter table public.subscription_plans force row level security;
alter table public.subscription_plan_entitlements force row level security;
alter table public.user_subscriptions force row level security;

drop policy if exists subscription_plans_select_active on public.subscription_plans;
create policy subscription_plans_select_active
    on public.subscription_plans
    for select
    to authenticated
    using (active = true);

drop policy if exists subscription_plan_entitlements_select_active on public.subscription_plan_entitlements;
create policy subscription_plan_entitlements_select_active
    on public.subscription_plan_entitlements
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.subscription_plans p
            where p.id = subscription_plan_entitlements.plan_id
              and p.active = true
        )
    );

drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
create policy user_subscriptions_select_own
    on public.user_subscriptions
    for select
    to authenticated
    using (user_id = auth.uid());

comment on table public.subscription_plans is 'Provider-neutral subscription plan definitions. Prices and payment-provider state are intentionally outside this foundation.';
comment on table public.subscription_plan_entitlements is 'Provider-neutral plan entitlements, including future AI usage limits and feature access.';
comment on table public.user_subscriptions is 'User subscription state. Client roles are read-only; billing/server workflows manage writes.';
