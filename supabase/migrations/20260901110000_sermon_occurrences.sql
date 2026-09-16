create table if not exists public.sermon_occurrences (
    id uuid primary key,
    sermon_id uuid not null references public.expository_sermons(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    scheduled_at timestamptz not null,
    status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
    venue text not null default '',
    service_name text not null default '',
    notes text not null default '',
    preached_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists sermon_occurrences_sermon_id_idx on public.sermon_occurrences(sermon_id);
create index if not exists sermon_occurrences_user_scheduled_at_idx on public.sermon_occurrences(user_id, scheduled_at desc);

alter table public.sermon_occurrences enable row level security;

drop policy if exists sermon_occurrences_select_own on public.sermon_occurrences;
create policy sermon_occurrences_select_own on public.sermon_occurrences for select using (auth.uid() = user_id);

drop policy if exists sermon_occurrences_insert_own on public.sermon_occurrences;
create policy sermon_occurrences_insert_own on public.sermon_occurrences for insert with check (auth.uid() = user_id);

drop policy if exists sermon_occurrences_update_own on public.sermon_occurrences;
create policy sermon_occurrences_update_own on public.sermon_occurrences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists sermon_occurrences_delete_own on public.sermon_occurrences;
create policy sermon_occurrences_delete_own on public.sermon_occurrences for delete using (auth.uid() = user_id);
