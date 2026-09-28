create table public.research_run_sources (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    research_run_id uuid not null references public.research_runs(id) on delete cascade,
    research_source_id uuid references public.research_sources(id) on delete set null,
    url text not null,
    title text not null default '',
    provenance_type text not null check (provenance_type in ('provider_citation', 'supplied_url')),
    citation_returned boolean not null default false,
    created_at timestamptz not null default now(),
    unique (research_run_id, url, provenance_type)
);

create index research_run_sources_user_id_idx on public.research_run_sources(user_id);
create index research_run_sources_run_id_idx on public.research_run_sources(research_run_id);
create index research_run_sources_source_id_idx on public.research_run_sources(research_source_id);

alter table public.research_run_sources enable row level security;

create policy "Users can view own research run sources"
on public.research_run_sources for select
using (user_id = auth.uid());

create policy "Users can insert own research run sources"
on public.research_run_sources for insert
with check (user_id = auth.uid());

create policy "Users can update own research run sources"
on public.research_run_sources for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own research run sources"
on public.research_run_sources for delete
using (user_id = auth.uid());

insert into public.research_run_sources (user_id, research_run_id, research_source_id, url, title, provenance_type, citation_returned, created_at)
select
    rr.user_id,
    rr.id,
    rs.id,
    src.url,
    coalesce(src.title, src.url),
    'provider_citation',
    true,
    rr.created_at
from public.research_runs rr
cross join lateral jsonb_to_recordset(rr.sources) as src(url text, title text)
left join public.research_sources rs on rs.user_id = rr.user_id and rs.url = src.url
where src.url is not null and trim(src.url) <> ''
on conflict (research_run_id, url, provenance_type) do nothing;

insert into public.research_run_sources (user_id, research_run_id, research_source_id, url, title, provenance_type, citation_returned, created_at)
select
    rr.user_id,
    rr.id,
    rs.id,
    trim(src.url),
    coalesce(rs.title, trim(src.url)),
    'supplied_url',
    false,
    rr.created_at
from public.research_runs rr
cross join lateral jsonb_array_elements_text(rr.source_urls) as src(url)
left join public.research_sources rs on rs.user_id = rr.user_id and rs.url = trim(src.url)
where trim(src.url) <> ''
on conflict (research_run_id, url, provenance_type) do nothing;
