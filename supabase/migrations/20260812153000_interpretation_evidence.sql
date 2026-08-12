create table if not exists public.interpretation_evidence (
    id uuid primary key,
    interpretation_id uuid not null references public.study_interpretations(id) on delete cascade,
    study_id uuid not null references public.studies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    evidence_type text not null,
    description text not null,
    created_at timestamptz not null default now()
);

create index if not exists interpretation_evidence_interpretation_id_idx
    on public.interpretation_evidence(interpretation_id);

create index if not exists interpretation_evidence_study_id_idx
    on public.interpretation_evidence(study_id);

create index if not exists interpretation_evidence_user_id_idx
    on public.interpretation_evidence(user_id);

alter table public.interpretation_evidence enable row level security;

create policy "Users can read their own interpretation evidence"
    on public.interpretation_evidence
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own interpretation evidence"
    on public.interpretation_evidence
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own interpretation evidence"
    on public.interpretation_evidence
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own interpretation evidence"
    on public.interpretation_evidence
    for delete
    using (auth.uid() = user_id);
