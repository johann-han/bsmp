create table if not exists public.platform_user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('admin')),
    created_at timestamptz not null default now(),
    unique (user_id, role)
);

create index if not exists platform_user_roles_user_id_idx on public.platform_user_roles (user_id);

alter table public.platform_user_roles enable row level security;
alter table public.platform_user_roles force row level security;

drop policy if exists "Users can view their own platform roles" on public.platform_user_roles;
create policy "Users can view their own platform roles"
on public.platform_user_roles
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.platform_user_roles from anon, authenticated;
grant select on public.platform_user_roles to authenticated;
