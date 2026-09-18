create table if not exists public.subscription_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    subscription_id uuid references public.user_subscriptions(id) on delete set null,
    actor_user_id uuid references auth.users(id) on delete set null,
    event_type text not null check (event_type in (
        'manual_assigned',
        'activated',
        'trial_started',
        'past_due',
        'paused',
        'canceled',
        'ended',
        'provider_synced'
    )),
    provider text not null,
    external_event_id text,
    effective_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists subscription_events_user_created_at_idx
    on public.subscription_events (user_id, created_at desc);

create index if not exists subscription_events_subscription_created_at_idx
    on public.subscription_events (subscription_id, created_at desc);

create unique index if not exists subscription_events_provider_external_event_id_uidx
    on public.subscription_events (provider, external_event_id)
    where external_event_id is not null;

alter table public.subscription_events enable row level security;
alter table public.subscription_events force row level security;

drop policy if exists "Users can view their own subscription events" on public.subscription_events;
create policy "Users can view their own subscription events"
on public.subscription_events
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.subscription_events from anon, authenticated;
grant select on public.subscription_events to authenticated;
