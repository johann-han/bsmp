create table if not exists public.study_applications (
    id uuid primary key,
    study_id uuid not null references public.studies(id) on delete cascade,
    interpretation_id uuid not null references public.study_interpretations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    principle text not null,
    personal text not null,
    ministry text not null,
    action text not null,
    created_at timestamptz not null default now()
);

create index if not exists study_applications_study_id_idx
    on public.study_applications(study_id);

create index if not exists study_applications_interpretation_id_idx
    on public.study_applications(interpretation_id);

create index if not exists study_applications_user_id_idx
    on public.study_applications(user_id);

alter table public.study_applications enable row level security;

create policy "Users can read their own applications"
    on public.study_applications
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own applications"
    on public.study_applications
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own applications"
    on public.study_applications
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own applications"
    on public.study_applications
    for delete
    using (auth.uid() = user_id);
