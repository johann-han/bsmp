create table if not exists public.studies (
    id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    status text not null,
    passage_start_book text not null,
    passage_start_chapter integer not null,
    passage_start_verse integer not null,
    passage_end_book text not null,
    passage_end_chapter integer not null,
    passage_end_verse integer not null,
    created_at timestamptz not null default now()
);

create table if not exists public.study_observations (
    id uuid primary key,
    study_id uuid not null references public.studies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    verse_book text not null,
    verse_chapter integer not null,
    verse_verse integer not null,
    statement text not null,
    created_at timestamptz not null default now()
);

create index if not exists studies_user_id_idx
    on public.studies(user_id);

create index if not exists study_observations_study_id_idx
    on public.study_observations(study_id);

create index if not exists study_observations_user_id_idx
    on public.study_observations(user_id);

alter table public.studies enable row level security;
alter table public.study_observations enable row level security;

create policy "Users can read their own studies"
    on public.studies
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own studies"
    on public.studies
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own studies"
    on public.studies
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own studies"
    on public.studies
    for delete
    using (auth.uid() = user_id);

create policy "Users can read their own observations"
    on public.study_observations
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own observations"
    on public.study_observations
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own observations"
    on public.study_observations
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own observations"
    on public.study_observations
    for delete
    using (auth.uid() = user_id);
