create table if not exists public.ai_usage_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    study_id uuid references public.studies(id) on delete set null,
    feature text not null,
    operation text not null default 'generate',
    provider text not null,
    model text not null,
    status text not null default 'success' check (status in ('success', 'error')),
    duration_ms integer,
    input_tokens bigint,
    output_tokens bigint,
    total_tokens bigint,
    estimated_cost_usd numeric(12, 6),
    error_code text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_created_at_idx
    on public.ai_usage_events(user_id, created_at desc);
create index if not exists ai_usage_events_study_created_at_idx
    on public.ai_usage_events(study_id, created_at desc);
create index if not exists ai_usage_events_feature_created_at_idx
    on public.ai_usage_events(feature, created_at desc);

alter table public.ai_usage_events enable row level security;
alter table public.ai_usage_events force row level security;

drop policy if exists "ai_usage_events_select_own" on public.ai_usage_events;
create policy "ai_usage_events_select_own"
    on public.ai_usage_events
    for select
    to authenticated
    using (auth.uid() = user_id);

comment on table public.ai_usage_events is 'Server-recorded AI usage ledger for quotas, cost accounting, and future subscription entitlements. Client roles intentionally have no insert/update/delete policy.';
