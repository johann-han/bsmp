create table public.research_sources (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    study_id uuid references public.studies(id) on delete set null,
    url text not null,
    title text not null,
    source_type text not null default 'external',
    notes text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_used_at timestamptz,
    constraint research_sources_https_url check (url ~* '^https://'),
    constraint research_sources_unique_user_url unique (user_id, url)
);

create index research_sources_user_id_idx on public.research_sources(user_id);
create index research_sources_study_id_idx on public.research_sources(study_id);

alter table public.research_sources enable row level security;

create policy "research_sources_select_own"
    on public.research_sources for select
    using (auth.uid() = user_id);

create policy "research_sources_insert_own"
    on public.research_sources for insert
    with check (auth.uid() = user_id);

create policy "research_sources_update_own"
    on public.research_sources for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "research_sources_delete_own"
    on public.research_sources for delete
    using (auth.uid() = user_id);
