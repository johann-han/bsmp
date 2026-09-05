create table if not exists public.biblical_theology_entries (
    id uuid primary key,
    study_id uuid not null references public.studies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    theme text not null,
    synthesis text not null,
    interpretation_ids uuid[] not null default '{}',
    created_at timestamptz not null default now()
);

alter table public.biblical_theology_entries enable row level security;

create policy "biblical theology select own" on public.biblical_theology_entries
    for select using (auth.uid() = user_id);
create policy "biblical theology insert own" on public.biblical_theology_entries
    for insert with check (auth.uid() = user_id);
create policy "biblical theology update own" on public.biblical_theology_entries
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "biblical theology delete own" on public.biblical_theology_entries
    for delete using (auth.uid() = user_id);

create index if not exists biblical_theology_entries_study_id_idx on public.biblical_theology_entries(study_id);
