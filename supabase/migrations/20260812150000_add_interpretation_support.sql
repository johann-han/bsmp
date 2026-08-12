create table if not exists public.study_interpretations (
    id uuid primary key,
    study_id uuid not null references public.studies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    statement text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.interpretation_observations (
    interpretation_id uuid not null references public.study_interpretations(id) on delete cascade,
    observation_id uuid not null references public.study_observations(id) on delete cascade,
    primary key (interpretation_id, observation_id)
);

create index if not exists study_interpretations_study_id_idx
    on public.study_interpretations(study_id);

create index if not exists study_interpretations_user_id_idx
    on public.study_interpretations(user_id);

create index if not exists interpretation_observations_observation_id_idx
    on public.interpretation_observations(observation_id);

alter table public.study_interpretations enable row level security;
alter table public.interpretation_observations enable row level security;

create policy "Users can read their own interpretations"
    on public.study_interpretations
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own interpretations"
    on public.study_interpretations
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own interpretations"
    on public.study_interpretations
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own interpretations"
    on public.study_interpretations
    for delete
    using (auth.uid() = user_id);

create policy "Users can read supported observations for their interpretations"
    on public.interpretation_observations
    for select
    using (
        exists (
            select 1
            from public.study_interpretations i
            where i.id = interpretation_id
              and i.user_id = auth.uid()
        )
    );

create policy "Users can create supported observations for their interpretations"
    on public.interpretation_observations
    for insert
    with check (
        exists (
            select 1
            from public.study_interpretations i
            where i.id = interpretation_id
              and i.user_id = auth.uid()
        )
        and exists (
            select 1
            from public.study_observations o
            where o.id = observation_id
              and o.user_id = auth.uid()
        )
    );

create policy "Users can delete supported observations for their interpretations"
    on public.interpretation_observations
    for delete
    using (
        exists (
            select 1
            from public.study_interpretations i
            where i.id = interpretation_id
              and i.user_id = auth.uid()
        )
    );
