alter table public.expository_sermons
    add column if not exists teaching_plan_id uuid references public.teaching_plans(id) on delete set null;

create index if not exists idx_expository_sermons_teaching_plan_id
    on public.expository_sermons(teaching_plan_id);
