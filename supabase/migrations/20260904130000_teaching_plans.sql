create table if not exists public.teaching_plans (
    id uuid primary key default gen_random_uuid(),
    study_id uuid not null references public.studies(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    audience text not null default '',
    central_truth text not null default '',
    teaching_aim text not null default '',
    explanation text not null default '',
    key_points text[] not null default '{}',
    discussion_questions text[] not null default '{}',
    response_prompt text not null default '',
    supporting_interpretation_ids uuid[] not null default '{}',
    supporting_biblical_theology_ids uuid[] not null default '{}',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_teaching_plans_user_id on public.teaching_plans(user_id);
create index if not exists idx_teaching_plans_study_id on public.teaching_plans(study_id);

alter table public.teaching_plans enable row level security;

drop policy if exists "teaching_plans_select_own" on public.teaching_plans;
drop policy if exists "teaching_plans_insert_own" on public.teaching_plans;
drop policy if exists "teaching_plans_update_own" on public.teaching_plans;
drop policy if exists "teaching_plans_delete_own" on public.teaching_plans;

create policy "teaching_plans_select_own"
    on public.teaching_plans for select
    using (auth.uid() = user_id);

create policy "teaching_plans_insert_own"
    on public.teaching_plans for insert
    with check (auth.uid() = user_id);

create policy "teaching_plans_update_own"
    on public.teaching_plans for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "teaching_plans_delete_own"
    on public.teaching_plans for delete
    using (auth.uid() = user_id);

create or replace function public.set_teaching_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists set_teaching_plans_updated_at on public.teaching_plans;
create trigger set_teaching_plans_updated_at
before update on public.teaching_plans
for each row execute function public.set_teaching_plans_updated_at();
