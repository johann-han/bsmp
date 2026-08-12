create table if not exists public.expository_sermons (
    id uuid primary key,
    study_id uuid not null references public.studies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    big_idea text,
    purpose text,
    created_at timestamptz not null default now()
);

create index if not exists expository_sermons_study_id_idx on public.expository_sermons(study_id);
create index if not exists expository_sermons_user_id_idx on public.expository_sermons(user_id);

create table if not exists public.sermon_outline_points (
    id uuid primary key,
    sermon_id uuid not null references public.expository_sermons(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    heading text not null,
    truth text not null,
    position integer not null,
    created_at timestamptz not null default now()
);

create index if not exists sermon_outline_points_sermon_id_idx on public.sermon_outline_points(sermon_id);
create index if not exists sermon_outline_points_user_id_idx on public.sermon_outline_points(user_id);

alter table public.expository_sermons enable row level security;
alter table public.sermon_outline_points enable row level security;

create policy "Users can read their own sermons" on public.expository_sermons for select using (auth.uid() = user_id);
create policy "Users can create their own sermons" on public.expository_sermons for insert with check (auth.uid() = user_id);
create policy "Users can update their own sermons" on public.expository_sermons for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own sermons" on public.expository_sermons for delete using (auth.uid() = user_id);

create policy "Users can read their own sermon outline points" on public.sermon_outline_points for select using (auth.uid() = user_id);
create policy "Users can create their own sermon outline points" on public.sermon_outline_points for insert with check (auth.uid() = user_id);
create policy "Users can update their own sermon outline points" on public.sermon_outline_points for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own sermon outline points" on public.sermon_outline_points for delete using (auth.uid() = user_id);
