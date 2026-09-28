create table public.research_runs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    study_id uuid not null references public.studies(id) on delete cascade,
    question text not null,
    focus text not null default 'general',
    answer text not null,
    textual_basis jsonb not null default '[]'::jsonb,
    further_questions jsonb not null default '[]'::jsonb,
    cautions jsonb not null default '[]'::jsonb,
    sources jsonb not null default '[]'::jsonb,
    source_urls jsonb not null default '[]'::jsonb,
    provider text not null,
    model text not null,
    created_at timestamptz not null default now()
);

create index research_runs_user_id_idx on public.research_runs(user_id);
create index research_runs_study_id_idx on public.research_runs(study_id);
create index research_runs_created_at_idx on public.research_runs(created_at desc);

alter table public.research_runs enable row level security;

create policy "research_runs_select_own"
    on public.research_runs for select
    using (auth.uid() = user_id);

create policy "research_runs_insert_own"
    on public.research_runs for insert
    with check (auth.uid() = user_id);

create policy "research_runs_delete_own"
    on public.research_runs for delete
    using (auth.uid() = user_id);
