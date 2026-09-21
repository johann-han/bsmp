create table if not exists public.billing_payment_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_id uuid not null references public.subscription_plans(id) on delete restrict,
    provider text not null,
    merchant_payment_id text not null,
    amount numeric(12,2) not null check (amount >= 0),
    currency text not null default 'ZAR' check (currency = 'ZAR'),
    status text not null default 'pending' check (status in ('pending','complete','failed','cancelled')),
    external_payment_id text,
    external_subscription_id text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists billing_payment_attempts_provider_merchant_payment_id_idx
    on public.billing_payment_attempts(provider, merchant_payment_id);
create unique index if not exists billing_payment_attempts_provider_external_payment_id_idx
    on public.billing_payment_attempts(provider, external_payment_id)
    where external_payment_id is not null;
create index if not exists billing_payment_attempts_user_created_at_idx
    on public.billing_payment_attempts(user_id, created_at desc);

alter table public.billing_payment_attempts enable row level security;
alter table public.billing_payment_attempts force row level security;

drop policy if exists billing_payment_attempts_select_own on public.billing_payment_attempts;
create policy billing_payment_attempts_select_own
    on public.billing_payment_attempts
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.billing_payment_attempts from anon, authenticated;
grant select on public.billing_payment_attempts to authenticated;
